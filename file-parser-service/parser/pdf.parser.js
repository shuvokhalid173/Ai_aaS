const ParserStrategy = require('./parser');

class PDFParser extends ParserStrategy {
  parse(file) {
    // Implement PDF parsing logic here
    return `Parsing PDF file: ${file.name}`;
  }
}

module.exports = PDFParser;