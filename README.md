# Figma copyDoc Translate tool 
Translate is a tool to quickly simplify the long task of translating text inside of Figma by bridging the gap between Figma and Translation tools like DeepL

## How to use
*note: The copyDoc plugin for Figma is recommended as this tool was built with this plugin in mind*

- Inside of copyDoc, click localise frames and export as XLSX
- Import this file into Translate
- Translate should find the correct column, which should be the one labbeled 'figma_text'
- Scroll to bottom and **download the extracted data**
- Translate the text document using any translation tool that keeps the formatting the same (deepL recommended)
- Use the 'I'll translate the document manually' button and then import the translated text file back into Translate
- The end column that was created by copyDoc should now be filled in with the translated data!
- Now import this back into copyDoc, and your content will be localised!

## Auto translating:

Due to limits on deepL's free API, the Auto translate barely works as their is a character limit of 500,000 a month. Manual translating is recommended because of this
