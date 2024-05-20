const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app =express()
require('dotenv').config()
const port = process.env.PORT || 5000
//middleware
app.use(cors())
app.use(express.json())

app.get('/' , (req ,res)=>{
    res.send("Hello Inside from the Server")
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vivchso.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri)
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    
    const appointmentCollection = client.db('doctorsPortal').collection('appointment')
    const bookingsCollection = client.db('doctorsPortal').collection('bookings')

    app.get( '/appointment' , async(req , res)=>{
        const date = req.query.date;
            const query = {};
            const options = await appointmentCollection.find(query).toArray();

            // get the bookings of the provided date
            const bookingQuery = { appointmentDate: date }
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();

            // code carefully :D
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name);
                const bookedSlots = optionBooked.map(book => book.slot);
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
                option.slots = remainingSlots;
            })
            res.send(options);
    })
    app.post('/bookings' , async(req , res)=>{
        const booking = req.body;
            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.email,
                treatment: booking.treatment 
            }

            const alreadyBooked = await bookingsCollection.find(query).toArray();

            if (alreadyBooked.length){
                const message = `You already have a booking on ${booking.appointmentDate}`
                return res.send({acknowledged: false, message})
            }

            const result = await bookingsCollection.insertOne(booking);
            res.send(result); 
    })

  } 
  finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port ,()=>{
    console.log(`Listening port ${port}`)
})