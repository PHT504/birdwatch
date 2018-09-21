const request = require('request');
const key = require('../config.js');

/*
make a function that makes a request to the ebird that obtains all of the recent sitings for birds
in the metro new orleans area

*/
/* TODO
Set env key for ebird call;
*/

const eBird = (callback) => {
  const options = {
    headers: {
      'X-eBirdApiToken': key.ebirdKEY,
    },
  };
  request('https://ebird.org/ws2.0/data/obs/US-LA-071/recent', options, (err, response, body) => {
    if (err) {
      console.error(err);
    } callback(err, response, body);
  });
};

/*
build a function that responds to a user input of a string
that is a bird name and a string that is a location
that then returns
`{
    "birdCommon": "test-bird",
    "birdScience": "testus-birdus",
    "user": "test",
    "flockSize": 20,
    "location": {
        "lat": 30.000001,
        "lng": -90.095701
    }
}

*/
const sciName = (name, callback) => {
  request(`http://www.xeno-canto.org/api/2/recordings?query=${name}`, (err, response, body) => {
    if (err) {
      console.error(err);
    } callback(err, response, body);
  });
};

const coords = (location, callback) => {
  request(`https://maps.googleapis.com/maps/api/geocode/json?address=${location}&key=${key.gKey}`, (err, response, body) => {
    if (err) {
      console.error(err);
    } callback(err, response, body);
  });
};
/*
***
build a method that obtains the soundclip and sciName
build a method that obtains a photo and descritption

*/

const getImgDes = (bird, callback) => {
  request(`http://en.wikipedia.org//w/api.php?action=query&format=json&prop=info%7Cpageprops%7Cdescription%7Cimages&titles=${bird}`,
  (err, response, body) => {
    if (err) {
      console.error(err);
    } callback(err, response, body);
  });
};
const getClipSci = (bird, callback) => {
  request(`http://www.xeno-canto.org/api/2/recordings?query=${bird}`,
(err, response, body) => {
  if (err) {
    console.error(err);
  } callback(err, response, body);
});
};
module.exports.getClipSci = getClipSci;
module.exports.getImgDes = getImgDes;
module.exports.coords = coords;
module.exports.sciName = sciName;
module.exports.eBird = eBird;
