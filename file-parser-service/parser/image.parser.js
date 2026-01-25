const ParserStrategy = require('./parser');

class ImageParser extends ParserStrategy {
  parse(file) {
    // Implement image parsing logic here
    return `Parsing image file: ${file.name}`;
  }
}

module.exports = ImageParser;