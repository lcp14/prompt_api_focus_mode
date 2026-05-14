import DOMPurify from 'dompurify';
import { marked } from 'marked';

const MAX_MODEL_CHARS = 4000;

let pageContent = '';

const summaryElement = document.body.querySelector('#summary');
const warningElement = document.body.querySelector('#warning');

chrome.storage.session.get(['pageContent', 'url'], function (result) {
  const { pageContent, url } = result;
  if (pageContent)
    onContentChange(pageContent);
  else
    onContentPDF(url)
});
chrome.storage.session.onChanged.addListener((changes) => {
  const pageContent = changes['pageContent'];
  const url = changes['url'];
  if (pageContent)
    onContentChange(pageContent.newValue);
  else
    onContentPDF(url.newValue);
});

async function onContentPDF(url) {
  const text = await extractPdfText(url);
  if (text) {
    generateQuestions(text);
  }
}

async function extractPdfText(url) {
  // PDF.js is loaded via manifest as a side panel script
  const pdfjsLib = window.pdfjsLib
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('libs/pdf.worker.mjs');
  try {
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 3); // cap to avoid huge prompts

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(' ');
      fullText += `\n--- Page ${i} ---\n${pageText}`;
    }

    return fullText.trim();
  } catch (err) {
    console.error('PDF extraction failed:', err);
    return null;
  }
}

async function onContentChange(newContent) {
  if (pageContent == newContent) {
    // no new content, do nothing
    return;
  }
  pageContent = newContent;

  generateQuestions(newContent);
}

const prompOptions = () => ({
  expectedInputs: [
    { type: 'text', languages: ['en'] }
  ],
  expectedOutputs: [
    { type: "text", languages: ["en"] }
  ],
})

async function generateQuestions(newContent) {
  const availability = await LanguageModel.availability(prompOptions());
  if (availability === 'unavailable') {
    console.error('LanguageModel is not available')
  }

  const session = await LanguageModel.create({
    ...prompOptions(),
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`Downloaded ${e.loaded * 100}%`);
      });
    },
    initialPrompts: [
      {
        role: 'system', content: 'You are a helpful teacher that create quizzes to help users understand the page content'
      },
    ]
  });


  session.addEventListener("contextoverflow", () => {
    console.info("We've gone past the context window, and some inputs will be dropped!");
  });

  const prompt = `Based on the following page content, create 3 multiple-choice questions:
  ---
  ${newContent}
  ---

  Questions:
  `
  const schema = {
    type: "object",
    properties: {
      questions: {
        type: "array",
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            question: {
              type: "string",
              description: "The quiz question"
            },

            optionA: {
              type: "string",
              description: "Option A"
            },

            optionB: {
              type: "string",
              description: "Option B"
            },

            optionC: {
              type: "string",
              description: "Option C"
            },

            optionD: {
              type: "string",
              description: "Option D"
            },

            answer: {
              type: "string",
              enum: ["A", "B", "C", "D"],
              description: "Correct option letter"
            },

            answerExplanation: {
              type: "string",
              description: "Explanation of why the answer is correct"
            }
          },

          required: [
            "question",
            "optionA",
            "optionB",
            "optionC",
            "optionD",
            "answer"
          ],

          additionalProperties: false
        }
      }
    },

    required: ["questions"],

    additionalProperties: false
  };

  const result = await session.prompt(prompt, {
    responseConstraint: schema
  });

  renderQuestions(JSON.parse(result));
}

function renderQuestions(data) {
  const questionsContainer = document.getElementById("questions");

  questionsContainer.innerHTML = "";

  data.questions.forEach((q, index) => {

    const card = document.createElement("div");
    card.className = "question-card";

    card.innerHTML = getTemplate(q, index)

    questionsContainer.appendChild(card);
  });
}

function getTemplate(q, index) {
  return DOMPurify.sanitize(`
          <div class="question-description">

            <div class="question-title">
              ${index + 1}. ${q.question}
            </div>

            <div class="options">
              <div class="option">
                <strong>A:</strong> ${q.optionA}
              </div>

              <div class="option">
                <strong>B:</strong> ${q.optionB}
              </div>

              <div class="option">
                <strong>C:</strong> ${q.optionC}
              </div>

              <div class="option">
                <strong>D:</strong> ${q.optionD}
              </div>
            </div>

            <details class="question-answer">
              <summary>Show Answer</summary>

              <div class="correct-answer">
                Correct Answer: <strong>${q.answer}</strong>
              </div>

              <div class="answer-explanation">
                ${q.answerExplanation || ""}
              </div>
            </details>

          </div>
        `);
}