// const Promise = require('bluebird');
// const passport = require('passport');

// const connectionString = process.env.PSQL;
const pgp = require('pg-promise')();
const config = require('../config');


const cn = {
  host: 'pellefant.db.elephantsql.com', // server name or IP address;
  port: 5432,
  database: 'cbpbgvhd',
  user: 'cbpbgvhd',
  password: process.env.LIBPASS || config.libPass,
};
const db = pgp(cn);

// export an object with query functions, promisified
module.exports = {
  // get user by username
  getUser: username =>
    db.any('SELECT * FROM users WHERE username = $1', [username]),
  // get list of birds from the DB
  getBirdsInDb: () =>
    db.any('SELECT * FROM birds'),
  // gets one bird by scienceName
  getOneBird: birdScience =>
    db.any('SELECT * FROM birds WHERE scientific_name = $1', [birdScience]),
  // need to get the three main tables id's
  getBirdId: birdScience =>
    db.any('SELECT id FROM birds WHERE scientific_name = $1', [birdScience]),
  getUserId: username =>
    db.any('SELECT id FROM users WHERE username = $1', [username]),
  getLocId: ({ lat, lng }) =>
    db.any('SELECT id FROM locations WHERE lat = $1 AND lng = $2', [lat, lng]),
  getUserLocId: (userId, locId) =>
    db.any('SELECT id FROM users_locations WHERE id_locations = $2 AND id_users = $1', [userId, locId]),
    // get birds by a particular user
  getBirdsByUser: username =>
    db.any('SELECT * FROM birds WHERE id = (SELECT id_bird FROM birds_users_locs WHERE id_user_loc = (SELECT id FROM users_locations WHERE id_users = (SELECT id FROM users where username = $1)))', [username]),
  // grab the first seen so as to be used to determine rarity
  getFirstSeen: (birdScience, { lat, lng }) =>
    db.any('SELECT first_seen FROM birds_location WHERE id_bird = (SELECT id FROM birds WHERE scientific_name = $1) AND id_loc = (SELECT id FROM locations WHERE lat = $2 AND lng = $3)', [birdScience, lat, lng]),
  // grab the sightings
  getSightings: (birdId, locId) =>
    db.any('SELECT sightings FROM birds_location WHERE id_loc = $1 AND id_bird = $2', [locId, birdId]),
  // need to get the rarity
  getRarity: (birdId, locId) =>
    db.any('SELECT rarity FROM birds_location WHERE id_bird = $1 AND id_loc = $2', [birdId, locId]),
  // need to get the last seen and flock stuff from the checklist
  getLastSeenFlock: (birdId, userLocID) =>
    db.any('SELECT recent_group_size, last_seen FROM birds_users_locs WHERE id_birds = $1 AND id_users_locations = $2', [birdId, userLocID]),
  // get everything from birdloc
  getBirdLocData: () =>
    db.any('SELECT * FROM birds_location'),
  // get birdinfo by id
  getBirdById: (birdId) => 
    db.any('SELECT * FROM birds WHERE id = $1', [birdId]),
  getLocById: (locId) =>
    db.any('SELECT * FROM locations WHERE id = $1', [locId]),
  // create user
  createUser: (user, password) =>
    db.any('INSERT INTO users (username, password) VALUES ($1, $2)', [user, password]),


  // adds a bird to the bird database
  createBird: (birdCommon, birdScience) =>
    db.any('INSERT INTO birds (common_name, scientific_name) VALUES ($1, $2)', [birdCommon, birdScience]),

  // stores a lat and lng location
  storeLocation: ({ lat, lng }) =>
    db.any('INSERT INTO locations (lat, lng) VALUES ($1, $2)', [lat, lng]),

  // insert into the joined tables which includes the birds_location thats
  // helps with figuring rarity by keeping firstSeen
  storeFirstSeen: (birdId, locId, firstSeen) =>
    db.any('INSERT INTO birds_location (id_loc, id_bird, first_seen, rarity, sightings) VALUES ($1, $2, $3, $4, $5)', [locId, birdId, firstSeen, 1, 1]),

  // need to maintain the joined tables
  addToUserLocations: (userId, locId) =>
    db.any('INSERT INTO users_locations (id_locations, id_users) VALUES ($1, $2)', [locId, userId]),

  // adds a bird sighting to the global checklist. checklist is a birding term
  addToChecklist: (birdId, userLocID, lastSeen, flockSize) =>
    db.any(`INSERT INTO birds_users_locs
      (id_birds, id_users_locations, last_seen, recent_group_size)
      VALUES ($1, $2, $3, $4)`,
      [birdId, userLocID, lastSeen, flockSize]),

  // need to update the number of sightings
  updateSightingsAndRarity: (birdId, locId, rarity) =>
    db.any('UPDATE birds_location SET sightings = sightings + 1, rarity = $1 WHERE id_loc = $2 AND id_bird = $3', [rarity, locId, birdId]),

  // update the last time was seen and the flock size
  updateLastSeenAndFlock: (birdId, userLocID, lastSeen, flockSize) =>
    db.any('UPDATE birds_users_locs SET last_seen = $3, recent_group_size = $4 WHERE id_birds = $1 AND id_users_locations = $2', [birdId, userLocID, lastSeen, flockSize]),

};
