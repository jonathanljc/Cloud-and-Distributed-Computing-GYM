const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 5003;
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://leooh29:DoHTA3c5W08GHGQq@occupancydb.xq4hb.mongodb.net/?retryWrites=true&w=majority&appName=OccupancyDB";

app.use(cors());
app.use(bodyParser.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});

client.connect();

const dbName = "GymOccupancy";
const database = client.db(dbName);
const gymsCollection = database.collection("gyms");
const checkedInCollection = database.collection("checkedIn");

// Get occupancy by counting number of checkedIn users in every gym
app.get('/api/occupancy', async (req, res) => {
    try {
        // find all gym documents 
        let cursor = gymsCollection.find();
        let gyms = [];
        for await (const doc of cursor) {
            gyms.push(doc);
        }
        // console.log(gyms);
        // find all checkedIn documents 
        cursor = checkedInCollection.find();
        let checkedIns = [];
        for await (const doc of cursor) {
            checkedIns.push(doc);
        }
        // console.log(checkedIns);
        // Count number of checkIns for each gym
        for (let i = 0; i < gyms.length; i++) {
            let numOfGymGoers = 0;
            for (let j = 0; j < checkedIns.length; j++) {
                if (gyms[i].gymID == checkedIns[j].gymID) {
                    numOfGymGoers++;
                }
            }
            gyms[i].occupants = numOfGymGoers;
        }
        res.status(200).json(gyms);
    } 
    catch (err) {
        console.error(`Something went wrong trying to find the documents: ${err}\n`);
        res.sendStatus(500);
    }
});

// Update occupancy by adding check-in record/document
app.post('/api/check-in', async (req, res) => {
    // TO-DO: 
    // validate check-in by checking if user is already checked in to the same gym. 
    
    const user = req.body[0];
    const gym = req.body[1];

    const checkIn = {
        userID : user,
        gymID : gym,
        timestamp : new Date().toString()
    };

    try {
        // console.log(checkIn);
        await checkedInCollection.insertOne(checkIn);
        console.log("Inserted check-in record");
        res.sendStatus(200);
    }
    catch (err) {
        console.error(`Something went wrong trying to find the documents: ${err}\n`);
        res.sendStatus(500);
    }
});

app.post('/api/check-out', async (req, res) => {
    // TO-DO: 
    // validate check-out by checking if user has checked in to the gym. 

    const user = req.body[0];
    const gym = req.body[1];

    const filter = {
        userID : user,
        gymID : gym
    }

    try {
        await checkedInCollection.deleteOne(filter)
        console.log("Deleted check-in record");
        res.sendStatus(200);
    }
    catch (err) {
        console.error(`Something went wrong trying to find the documents: ${err}\n`);
        res.sendStatus(500);
    }
});

app.listen(PORT, () => {
    console.log(`Occupancy service running on port ${PORT}`);
});