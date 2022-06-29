const express = require('express')
const { Server: HttpServer } = require('http')
const { Server: IOServer } = require('socket.io')
const Contenedor = require('./src/controllers/contenedorMsg.js')
const Container = require('./src/controllers/contenedorProd.js')
const app = express()
const httpServer = new HttpServer(app)
const io = new IOServer(httpServer)

const { response } = require('express')
const session = require('express-session')
const connectMongo = require('connect-mongo')
const cookieParser = require('cookie-parser')
const advancedOptions = {useNewUrlParser: true, useUnifiedTopology: true }
const MongoStore = connectMongo.create({
    mongoUrl: 'mongodb+srv://tobyceballos:coderhouse@cluster0.erpbj.mongodb.net/Cluster0?retryWrites=true&w=majority',
    mongoOptions: advancedOptions,
    ttl: 600
})



app.use(express.static('./src/public'))
app.set('view engine', 'ejs')
app.use(cookieParser())
app.use(session({
    store: MongoStore,
    secret: 'MySecretValue',
    resave: false,
    saveUninitialized: false,
}));
app.use(express.json())
app.use(express.urlencoded({ extended: false}))

let name;


app.get('/data', async (req, res) => {
    const datos = req.session.username
    res.render('index.ejs', { datos })
})
app.get('/', (req, res) => {
    res.render('login')
});



app.post('/login-post', async (req, res) => {
    try {
        const username = req.body.name;
        req.session.username = username;
        res.redirect('/data');
    }
    catch (err) {
        console.log(err);
        res.send({ error: err });
    }
})

app.get('/olvidar/:name', (req,res) => {
    const name = req.params.name
    req.session.destroy( err => {
        if (err) {
            res.json({error: 'olvidar', descripcion: err})
        } else {
            res.render('bye', { name })
        }
    })

})


io.on('connection', async (sockets) => {
    sockets.emit('product', await Container.getProds())
    console.log('Un cliente se ha conectado!: ' + sockets.id)
    // div
    sockets.emit('messages', await Contenedor.getMsg())

    sockets.on('new-product', async data => {
        await Container.saveProd(data)
        console.log(data)
        
        io.sockets.emit('product', await Container.getProds())
    })
    sockets.on('new-message', async dato => {

        await Contenedor.saveMsj(dato)
        console.log(dato)

        io.sockets.emit('messages', await Contenedor.getMsg())
    })
})





const PORT = 8080
httpServer.listen(PORT, () => console.log('Iniciando en el puerto: ' + PORT))