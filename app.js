const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DBError: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = ` 
        SELECT 
            player_id as playerId,
            player_name as playerName
        FROM
            player_details;
    `;
  const players = await db.all(getPlayersQuery);
  response.send(players);
});

// 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = ` 
        SELECT 
            player_id as playerId,
            player_name as playerName
        FROM player_details
        WHERE player_id = ${playerId};
    `;
  const playerDetails = await db.get(getPlayerQuery);
  response.send(playerDetails);
});

// 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerDetails = `
        UPDATE player_details
        SET 
            player_name = '${playerName}'
        WHERE
            player_id = ${playerId};
    `;
  await db.run(updatePlayerDetails);
  response.send("Player Details Updated");
});

// 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
    SELECT
       match_id as matchId,
       match, year
    FROM match_details
    WHERE match_id = ${matchId};
  `;
  const matchDetails = await db.get(getMatchDetails);
  response.send(matchDetails);
});

// 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatches = `
        SELECT
            match_details.match_id as matchId,
            match, year
        FROM match_details INNER JOIN player_match_score
         ON match_details.match_id = player_match_score.match_id
        WHERE player_id = ${playerId} ;
    `;

  const playerMatches = await db.all(getPlayerMatches);
  response.send(playerMatches);
});

// 6
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
        SELECT
            player_details.player_id as playerId,
            player_name as playerName
        FROM
            player_details INNER JOIN player_match_score ON
            player_details.player_id = player_match_score.player_id
        WHERE
             match_id = ${matchId};
    `;
  const matchDetails = await db.all(matchDetailsQuery);
  response.send(matchDetails);
});

// 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getStatsQuery = `
        SELECT 
            player_details.player_id as playerId,
            player_name as playerName,
            SUM(score) as totalScore,
            SUM(fours) as totalFours,
            SUM(sixes) as totalSixes
        FROM
            player_details INNER JOIN player_match_score ON
            player_details.player_id = player_match_score.player_id
        WHERE player_details.player_id = ${playerId};
    `;
  const totalStats = await db.get(getStatsQuery);
  response.send(totalStats);
});

module.exports = app;
