var mongoose = require('mongoose');
var Schema = require('mongoose').Schema;

var deviceSchema = new Schema({
  uuid: String,
  platform: String,
  online: Boolean,
  alias: String,
  version: String,
  manufacturer: String,
  model: String
})


module.exports = mongoose.model('device', deviceSchema);
module.exports.fake = [
  {
    uuid: "F378JKDIAEEDA3F4G1ADSG225DDV",
    platform: "iOS",
    online: true,
    alias: "Keyang's iPhone",
    version: "10.2",
    manufacturer: "Apple",
    model: "iOS"
  },
  {
    uuid: "u3dbbf3sg9jf3",
    platform: "Android",
    online: true,
    alias: "Joe Android",
    version: "5.1",
    manufacturer: "Samsumg",
    model: "Android"
  },
  {
    uuid: "d3tv30kf",
    platform: "Android",
    online: false,
    alias: "Tim",
    version: "4.4",
    manufacturer: "HTC",
    model: "Android"
  }
]