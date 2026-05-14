# On-device Quizz with Gemini Nano

This sample demonstrates how to use Chrome's built-in Prompt API to generate AI-powered a quizz based on content of web pages directly on the user's device. The process runs entirely locally using Gemini Nano, ensuring privacy and fast performance without requiring an internet connection or API keys.


## TODO
- [ ] Improve initial prompt to reduce use of tokens
- [ ] Shows only one question to improve performance, further questions would be an user action
- [ ] If possible show where LLM found the answer on page
- [x] Add the ability to create a quizz about PDF file

## Overview

This extension adds a side panel that automatically displays AI-generated questions of any web page you visit. It uses Mozilla's [Readability](https://github.com/mozilla/readability) library to extract the main content from web pages (stripping away navigation, ads, and other clutter), then passes that content to Chrome's built-in Summarizer API.

## Running this extension

1. Clone this repository.
2. Run `npm install` in this folder to install all dependencies.
3. Run `npm run build` to build the extension.
4. Load the newly created `dist` directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).
5. Click the extension icon to open the summary side panel.
6. Open any web page. The page's content summary will automatically be displayed in the side panel.

## Creating your own extension

If you use this sample as the foundation for your own extension, be sure to update the `"trial_tokens"` field [with your own origin trial token](https://developer.chrome.com/docs/web-platform/origin-trials#extensions) and to remove the `"key"` field in `manifest.json`.

## References

[Google Prompt API](https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/functional-samples/ai.gemini-on-device)
[Google Summarization API](https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/functional-samples/ai.gemini-on-device-summarization)