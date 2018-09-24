const express = require('express');
const birdCall = require('./lib/birdApi');
const db = require('./lib/psql');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const { eBird, sciName, coords, getImgDes, getClipSci } = require('./utils/utils');
const _ = require('lodash');
const config = require('./config.js');


const PORT = config.PORT;
const app = express();

app.use((req, res, next) => {
  console.log(`serving ${req.method} request for uri: ${req.url}`);
  if (req.body) {
    console.log(req.body);
  }
  next();
});

app.listen(PORT || 3000, () => {
  console.log(`Listening at ${PORT}`);
});

app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'it\'s a secret man',
  resave: false,
}));


app.post('/login', (req, res) => {
  console.log(req.session);
  db.getUser(req.body.username)
  .then((data) => {
    if (data.length) {
      console.log(data);

      // const salt = data[0].salt;
      // const servPassHash = data[0].password;
      // const sentPassHash = bcrypt.hashSync(req.body.password, salt);
      if (bcrypt.compareSync(req.body.password, data[0].password)) {
        req.session.regenerate(() => {
          req.session.user = req.body.username;
          res.writeHead(200);
          res.end();
        });
      } else {
        res.writeHead(401);
        res.end();
      }
    } else {
      res.writeHead(401);
      res.end();
    }
  })
  .catch(err => console.log(err));
});

app.post('/signup', (req, res) => {
  db.getUser(req.body.username)
  .then((data) => {
    if (data.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      const hashedPass = bcrypt.hashSync(req.body.password, salt);
      db.createUser(req.body.username, hashedPass)
      .then(() => {
        req.session.regenerate(() => {
          req.session.user = req.body.username;
          res.writeHead(200);
          res.end();
        });
      });
    } else {
      res.writeHead(401);
      res.write('user exists');
      res.end();
    }
  })
  .catch(err => console.log(err));
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    console.log('hit');
    res.writeHead(200);
    res.write('loggedout');
    res.end();
  });
});
/**
 * so when a bird is added a lot of things have to happen in particular order
 * first we need to add the bird to the bird db and store the common name and scientific name
 * then we need to store where this particular bird was seen
 * so we need to add this lat and long to our location database
 * once we make sure we have the location stored we can then grab its id
 * and we then grab the bird id. with these we can then update the most recent sighting information
 * since this was given to us by a user we need to then store the users id and loc id in their
 * join table. after that we can then update our user's checklist or add to it
 */

 /*
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

 /* *** TODO  ***
 create chain of async calls to be able to fill schema for USER DB;
 */
app.post('/birds', (req, res) => {
  const user = 'test';
  let userId;
  let userLocId;
  let birdId;
  let locId;
  let rarity;
  let firstSeen;
  let lastFlockSize;
  let lastSeen;
  let sightingTotal;
  res.writeHead(200);
  res.write('bird added!');
  console.log(req.body);
  const userBird = {};
  userBird.birdCommon = req.body.birdType;
  userBird.flockSize = req.body.flockSize;
  sciName(req.body.birdType, (err, response, body) => {
    if (err) {
      console.error(err);
    } const result = JSON.parse(body);
    console.log(result);
    const { gen, sp } = result.recordings[0];
    userBird.birdScience = `${gen} ${sp}`;
    coords(req.body.location, (error, resp, bod) => {
      if (err) {
        console.error(err);
      } const q = JSON.parse(bod);
      console.log(q);
      const { location } = q.results[0].geometry;
      userBird.location = location;
      userBird.location.lat = Number(Number.parseFloat(userBird.location.lat).toFixed(6));
      userBird.location.lng = Number(Number.parseFloat(userBird.location.lng).toFixed(6));
      console.log(userBird);
      const reuse = () => {
        // get the userid
        db.getUser(user)
        .then((userIdArr) => {
          console.log(userIdArr, ' holds the userId');
          if (userIdArr.length) {
            userId = userIdArr[0].id;
            console.log(userBird.location);
            db.getLocId(userBird.location)
            // check for locid
            .then((locIdArr) => {
              console.log(locIdArr, ' holds the locId');
              if (locIdArr.length > 0) {
                locId = locIdArr[0].id;
                db.getBirdId(userBird.birdScience)
                // check for birdid
                .then((birdIdArr) => {
                  console.log(birdIdArr, ' holds the birdId');
                  if (birdIdArr.length) {
                    birdId = birdIdArr[0].id;
                    db.getUserLocId(userId, locId)
                    // check for userlocid
                    .then((userLocArr) => {
                      console.log(userLocArr, ' holds userLocId');
                      if (userLocArr.length > 0) {
                        userLocId = userLocArr[0].id;
                        db.getFirstSeen(userBird.birdScience, userBird.location)
                        .then((firstSeenArr) => {
                          console.log(firstSeenArr, ' holds firstSeen value');
                          if (firstSeenArr.length > 0) {
                            // do stuff
                            firstSeen = firstSeenArr[0].first_seen;
                            db.getLastSeenFlock(birdId, userLocId)
                            .then((lastSeenAndFlock) => {
                              console.log(lastSeenAndFlock, ' holds the lastseen and flock values');
                              if (lastSeenAndFlock.length > 0) {
                                lastSeen = lastSeenAndFlock[0].last_seen;
                                lastFlockSize = lastSeenAndFlock[0].recent_group_size;
                                db.getRarity(birdId, locId)
                                .then((rareArray) => {
                                  console.log(rareArray, ' holds the rarity value');
                                  rarity = rareArray[0].rarity;
                                  db.getSightings(birdId, locId)
                                  .then((sightingArr) => {
                                    console.log(sightingArr, ' holds the number of sightings');
                                    sightingTotal = sightingArr[0].sightings;
                                    const time = (Date.now() - firstSeen) - (lastSeen - firstSeen);
                                    const currentFlockSize = userBird.flockSize;
                                    rarity = currentFlockSize + ((time / sightingTotal) * (lastFlockSize - currentFlockSize));
                                    console.log(rarity , ' this is rarity');
                                    db.updateSightingsAndRarity(birdId, locId, rarity)
                                    .catch((failedSightRarity) => {
                                      console.error(failedSightRarity);
                                    });
                                    db.updateLastSeenAndFlock(birdId, userLocId, Date.now(), currentFlockSize)
                                    .catch((failedLastSeen) => {
                                      console.error(failedLastSeen);
                                    });
                                    res.end();
                                  })
                                  .catch((error) => {
                                    console.error(error);
                                    console.log('getSightings');
                                  });
                                })
                                .catch((error) => {
                                  console.error(error);
                                  console.log('getRarity');
                                });
                              } else {
                                // having foreign key issues here as well
                                db.addToChecklist(birdId, userLocId, Date.now(), userBird.flockSize)
                                .then(() => {
                                  reuse();
                                })
                                .catch((error) => {
                                  console.error(error);
                                  console.log('addToChecklist');
                                });
                              }
                            })
                            .catch((error) => {
                              console.error(error);
                              console.log('getLastSeenFlock');
                            });
                          } else {
                            db.storeFirstSeen(birdId, locId, Date.now())
                            .then(() => {
                              reuse();
                            })
                            .catch((error) => {
                              console.error(error);
                              console.log('storeFirstSeen');
                            });
                          }
                        })
                        .catch((error) => {
                          console.error(error);
                          console.log('getFirstSeen');
                        });
                      } else {
                        // need to figure out why this didn't like foreign keys
                        db.addToUserLocations(userId, locId)
                        .then(() => {
                          console.log('added a row to users_locations');
                          reuse();
                        })
                        .catch((error) => {
                          console.error(error);
                          console.log('addToUserLocations');
                        });
                      }
                      console.log('empty');
                    })
                    .catch((error) => {
                      console.error(error);
                      console.log('getUserLocId');
                    });
                  } else {
                    db.createBird(userBird.birdCommon, userBird.birdScience)
                    .then(() => {
                      reuse();
                    })
                    .catch((error) => {
                      console.error(error);
                      console.log('createBird');
                    });
                  }
                })
                .catch((error) => {
                  console.error(error);
                  console.log('getBirdId');
                });
              } else {
                db.storeLocation(userBird.location)
                .then(() => {
                  reuse();
                })
                .catch((error) => {
                  console.error(error);
                  console.log('storeLocation');
                });
              }
            })
            .catch((error) => {
              console.error(error);
              console.log('getLocId');
            });
          }
        })
        .catch((error) => {
          console.error(error);
          console.log('getUser');
        });
      };
      reuse();
    });
  });
  // console.log('this is user session', req.session);
});

app.post('/map', (req, res) => {
  const latLng = req.body;
  const obj = latLng;
  const birdCatcher = (data) => {
    res.writeHead(200, { contentType: 'application/json' });
    res.write(data);
    res.end();
  };

  birdCall.call(obj, birdCatcher);
});

// get users most recent birds logged in db
app.get('/birds', (req, res) => {
  db.getBirdsInDb()
  .then((data) => {
    res.writeHead(200);
    res.write(JSON.stringify(data));
    res.end();
  }).catch((err) => {
    console.error(err);
  });
});

app.get('/map', (req, res) => {
  let bldata;
  const birds = [];
  const locations = [];
  db.getBirdLocData()
  .then((data) => {
    bldata = data;
    // console.log(bldata);
    bldata.forEach((birdLocObj, index) => {
      db.getBirdById(birdLocObj.id_bird)
      .then((birdData) => {
        birds.push(birdData);
        db.getLocById(birdLocObj.id_loc)
        .then((locData) => {
          locations.push(locData);
          if (index === bldata.length - 1) {
            const send = JSON.stringify({ bldata, birds, locations });
            res.send(send);
          }
        })
        .catch((error) => {
          console.error(error);
        });
      })
      .catch((error) => {
        console.error(error);
      });
    });
  })
  .catch((error) => {
    console.error(error);
  });
});

app.get('/profile', (req, res) => {
  db.getUser(req.session.user)
  .then((data) => {
    const id = data[0].id;
    db.getBirdsByUser(id)
    .then((info) => {
      res.writeHead(200);
      res.write(JSON.stringify(info));
      res.end();
    });
  });
});
/*
set route for get request from client to retrieve markers of local siting
*/
app.get('/eBird', (req, res) => {
  eBird((err, result, body) => {
    if (err) {
      console.error(err);
    } res.send(body);
  });
});
app.post('/search', (req, res) => {
/*
answers client request with an object with a bird common name
to send to api calls for photo, description and sound clip
*/
  getImgDes(req.body.search, (err, response, body) => {
    if (err) {
      console.error(err);
    } const q = JSON.parse(body);
    const k = _.pick(q, ['query']);
    const imgDes = Object.values(k.query.pages);
    const { description, pageprops } = imgDes[0];
    const imgArray = pageprops.page_image_free;
    getClipSci(req.body.search, (erro, response, bod) => {
      if (erro) {
        console.error(erro);
      } const g = JSON.parse(bod);
      const { gen, sp, file } = g.recordings[0];
      const send = {
        descript: description,
        imgs: imgArray,
        sciName: `${gen} ${sp}`,
        audio: file,
      };
      res.send(send);
    });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
});
