const express = require('express')
const app = express()
const {open} = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')
app.use(express.json())

const dbpath = path.join(__dirname, 'covid19India.db')
let db = null

const initialiseDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`Database Error: ${e.message}`)
    process.exit(1)
  }
}
initialiseDbAndServer()

//API 1 - GET METHOD
app.get('/states/', async (request, response) => {
  const getStates = `
    SELECT * FROM state;`
  const stateList = await db.all(getStates)
  response.send(
    stateList.map(state => ({
      stateId: state.state_id,
      stateName: state.state_name,
      population: state.population,
    })),
  )
})

//API 2 - GET METHOD (single response)
app.get('/states/:stateId', async (request, response) => {
  const {stateId} = request.params
  const getStates = `
    SELECT * FROM state
    WHERE state_id = ${stateId};`
  const stateList = await db.get(getStates)
  response.send({
    stateId: stateList.state_id,
    stateName: stateList.state_name,
    population: stateList.population,
  })
})

//API 3 - POST METHOD
app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const addDistrict = `
  INSERT INTO
  district (district_name, state_id, cases, cured, active, deaths)
  VALUES (
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths}
  );`
  await db.run(addDistrict)
  response.send('District Successfully Added')
})

//API 4 - GET DISTRICT
app.get('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const getDistrict = `
  SELECT * FROM district
  WHERE district_id = ${districtId};`
  const responseDistrict = await db.get(getDistrict)
  response.send({
    districtId: responseDistrict.district_id,
    districtName: responseDistrict.district_name,
    stateId: responseDistrict.state_id,
    cases: responseDistrict.cases,
    cured: responseDistrict.cured,
    active: responseDistrict.active,
    deaths: responseDistrict.deaths,
  })
})

//API 5 - DELETE METHOD
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrict = `
  DELETE FROM 
  district 
  WHERE district_id = ${districtId};`
  await db.run(deleteDistrict)
  response.send('District Removed')
})

//API 6 - PUT METHOD
app.put('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateDistrict = `
  UPDATE district
  SET 
  district_name = '${districtName}',
  state_id = ${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  WHERE district_id = ${districtId};`
  await db.run(updateDistrict)
  response.send('District Details Updated')
})

//API 7 - GET METHOD
app.get('/states/:stateId/stats', async (request, response) => {
  const {stateId} = request.params
  const getTotalReport = `
  SELECT 
  SUM(cases) AS totalCases,
  SUM(cured) AS totalCured, 
  SUM(active) AS totalActive,
  SUM(deaths) AS totalDeaths 
  FROM state NATURAL JOIN district 
  WHERE state.state_id = district.state_id AND state_id = ${stateId};`
  const totalReport = await db.get(getTotalReport)
  response.send({
    totalCases: totalReport.totalCases,
    totalCured: totalReport.totalCured,
    totalActive: totalReport.totalActive,
    totalDeaths: totalReport.totalDeaths,
  })
})

//API 8 - GET METHOD
app.get('/districts/:districtId/details', async (request, response) => {
  const {districtId} = request.params
  const getDistrict = `
  SELECT state.state_name AS sn FROM 
  state JOIN district 
  WHERE state.state_id = district.state_id AND 
  district_id = ${districtId};`
  const responseState = await db.get(getDistrict)
  response.send({
    stateName: responseState.sn,
  })
})

module.exports = app
