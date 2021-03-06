const Videojuego = require('../models/Videojuego');
const Sucursal = require('../models/Sucursal');
const path = require('path');
const express = require('express');
const router = express.Router({mergeParams: true});

router.post('/new', (req, res) => {
    //console.log('req.files: ', req.files);
    //console.log('req.body.videojuego: ', JSON.parse(req.body.videojuego));

    extensiones_permitidas = new Array(".gif", ".jpg", ".bmp",".png",".psd",".cdr",".dwg",".svg",".raw",".nef"); 
    let imagen = req.files.imagen.name;
    let extension = (imagen.substring(imagen.lastIndexOf("."))).toLowerCase(); 

    permitida = false; 
    for (var j = 0; j < extensiones_permitidas.length; j++) { 
       if (extensiones_permitidas[j] == extension) { 
       permitida = true; 
       break; 
       } 
    } 
    if (!permitida) { 
       mierror = "Sólo se pueden subir imagenes con extensiones: .gif, .jpg, .bmp, .png, .psd, .cdr, .dwg, .svg, .raw y .nef"; 
    return res.status(409).send({message:mierror});
    }

    let vj = JSON.parse(req.body.videojuego);

    if(vj.cantidadMinima > vj.cantidadMaxima){
        return res.status(409).send({message:"La cantidad minima debe ser menor o igual que la cantidad maxima!"});
    }

    let i = 0;
    req.files.imagen.name = vj.codigo + extension;
    let rutaImagen = "http://localhost:3000/img/" + req.files.imagen.name;
    let rutaAbsoluta = path.join(__dirname + "/../public/img/" + req.files.imagen.name);
    Videojuego.findOne({
        $or: [
            {codigo: vj.codigo},
           {
               $and: [{titulo_lower: vj.titulo_lower}, {plataforma: vj.plataforma}, {activo: true}]
           }
        ]
    }, (err, videojuegoExistente) => {
        if(err)
            return res.status(500).send({message: err.message});
        if(videojuegoExistente)
            return res.status(500).send({message: 'Ya existe un videojuego con ese codigo o con ese titulo y plataforma'});
        
        let videojuego = new Videojuego({
            titulo: vj.titulo,
            titulo_lower: vj.titulo.toLowerCase(),
            codigo: vj.codigo,
            genero: vj.genero,
            plataforma: vj.plataforma,
            cantidadMinima: vj.cantidadMinima,
            cantidadMaxima: vj.cantidadMaxima,
            imagen: rutaImagen,
            urlVideo: vj.urlVideo,
            precio: vj.precio,
            descuento: vj.descuento,
            destacado: vj.destacado,
            descripcion: vj.descripcion,
            stock: vj.stock,
            activo: true
        });
        console.log(rutaImagen);
        console.log(rutaAbsoluta);
        req.files.imagen.mv(rutaAbsoluta, (err) => {
            if(err){
                console.log('Error imagen');
                return res.status(400).send({message: 'Ocurrio un error al copiar imagen'});
            }
            videojuego.save((err) => {
                if(err)
                    return res.status(500).send({message: err.message});
                Sucursal.find({}, (err, sucursales) => {
                    if(err)
                        return res.status(500).send({message: err.message});
                    sucursales.forEach(sucursal => {
                        sucursal.videojuegos.push(videojuego);
                        sucursal.save((err) => {
                            if(err)
                                return res.status(500).send({message: err.message});
                            i++;
                            if(i == sucursales.length - 1) {
                                return res.status(200).send(videojuego);
                            }
                        });
                    });
                });
            });
        });
    });
});

    router.get('/', (req, res) => {
        Videojuego.find({activo: true}, (err, videojuegos) => {
            let videojuegosArr = [];
            if(err) {
                return res.status(500).send({message: err.message});
            }
            if(videojuegos) {
                videojuegos.forEach(v => {
                    videojuegosArr.push(v);
                });
            }
            res.send(videojuegosArr);
        });
    });

    router.put('/destacado', (req, res) => {
        //console.log('Llegue: ', req.body);
        Videojuego.findOne({codigo: req.body.codigo}, (err, videojuego) => {
            if(err) {
                return res.status(500).send({message: err.message});
            }
            if(videojuego) {
               videojuego.destacado = req.body.destacado;

               videojuego.save((err) => {
                    if(err) {
                        return res.status(500).send({message: err.message});
                    }
                    res.send(videojuego);
                });
            }
        });
    });

    router.put('/:id', (req, res) => {
        //console.log("JSON VIDEOJUEGO: " + req.body.videojuego);
        let vj = JSON.parse(req.body.videojuego);
        let i = 0;
        let rutaImagen;
        Videojuego.findById(req.params.id, (err, videojuego) => {
            if(err) {
                console.log("primer error interno");
                return res.status(500).send({message: err.message});
            }
                
            if(!videojuego) {
                console.log("error interno no encontre videjuego");
                return res.status(400).send({message: 'Videojuego no encontrado'});
            }

            if(req.files) {
                req.files.imagen.name = vj.codigo + ".jpg";
                rutaImagen = "http://localhost:3000/img/" + req.files.imagen.name;
                //videojuego.imagen = rutaImagen;
                //videojuego.file = req.files.imagen;
                let rutaAbsoluta = path.join(__dirname + "/../public/img/" + req.files.imagen.name);
                req.files.imagen.mv(rutaAbsoluta, (err) => {
                    if(err){
                        console.log('Error imagen');
                        return res.status(400).send({message: 'Ocurrio un error al copiar imagen'});
                    }
                });
            }

            videojuego.titulo = vj.titulo;
            videojuego.titulo_lower = vj.titulo.toLowerCase();
            videojuego.codigo = vj.codigo;
            videojuego.genero = vj.genero;
            videojuego.plataforma = vj.plataforma;
            videojuego.cantidadMinima = vj.cantidadMinima;
            videojuego.cantidadMaxima = vj.cantidadMaxima;
            videojuego.imagen = (req.files) ? rutaImagen : vj.imagen;
            videojuego.urlVideo = vj.urlVideo;
            videojuego.precio = vj.precio;
            videojuego.descuento = vj.descuento;
            videojuego.destacado = vj.destacado;
            videojuego.descripcion = vj.descripcion;
            videojuego.stock = vj.stock;
            videojuego.activo = true;

            videojuego.save((err) => {
                if(err) {
                    console.log("segundo error interno");
                    return res.status(500).send({message: err.message});
                }
                    
                Sucursal.find({}, (err, sucursales) => {
                    if(err) {
                        console.log("tercer error interno");
                        return res.status(500).send({message: err.message});
                    }
                    sucursales.forEach(sucursal => {
                        sucursal.videojuegos.forEach(function(v, index) {
                            if(v.codigo === videojuego.codigo) {
                                v.titulo_lower = videojuego.titulo_lower;
                                v.genero = videojuego.genero;
                                v.plataforma = videojuego.plataforma;
                                v.cantidadMinima = videojuego.cantidadMinima;
                                v.cantidadMaxima = videojuego.cantidadMaxima;
                                v.imagen = videojuego.imagen;
                                v.urlVideo = videojuego.urlVideo;
                                v.precio = videojuego.precio;
                                v.destacado = videojuego.destacado;
                                v.descripcion = videojuego.descripcion;
                                v.activo = true;
                                sucursal.videojuegos.splice(index, 1);
                                sucursal.videojuegos.splice(index, 0, v);
                            }
                        });
                        sucursal.save((err) => {
                            if(err) {
                                console.log("Cuarto error interno");
                                return res.status(500).send({message: err.message});
                            }  
                            i++;
                            if(i == sucursales.length - 1) {
                                return res.status(200).send(videojuego);
                            }
                        });
                    });
                });
            });
        });
        
    });

    router.delete('/:id', (req, res) => {
        let i = 0;
        Videojuego.findById(req.params.id, (err, videojuego) => {
            if(err) {
                return res.status(500).send({message: err.message});
            }
            if(!videojuego) {
                return res.status(400).send({message: 'Videojuego no encontrado'});
            }
            videojuego.activo = false;
            console.log("videojuego._id: ", videojuego._id);
            console.log("videojuego.codigo: ", videojuego.codigo);
            console.log("videojuego.titulo: ", videojuego.titulo);
            videojuego.save((err) => {
                if(err) {
                    console.log("segundo error interno");
                    return res.status(500).send({message: err.message});
                }
                Sucursal.find({}, (err, sucursales) => {
                    if(err) {
                        console.log("tercer error interno");
                        return res.status(500).send({message: err.message});
                    }
                    sucursales.forEach(sucursal => {
                        sucursal.videojuegos.forEach(function(v, index) {
                            if(v.codigo === videojuego.codigo) {
                                v.activo = false;
                                sucursal.videojuegos.splice(index, 1);
                                sucursal.videojuegos.splice(index, 0, v);
                                console.log("v.codigo: ", v.codigo);
                                console.log("videojuego.codigo: ", videojuego.codigo);
                                console.log("v.activo: ", v.activo);
                            }
                        });
                        sucursal.save((err) => {
                            if(err) {
                                console.log("Cuarto error interno");
                                return res.status(500).send({message: err.message});
                            }  
                            i++;
                            if(i == sucursales.length - 1) {
                                return res.status(200).send({message: 'Videojuego eliminado exitosamente'});
                            }
                        });
                    });
                });
            });
        });
    });

    router.get('/stockGlobal', (req, res) => {
        Sucursal.aggregate([
            {"$unwind": "$videojuegos"},
            {"$group": {"_id": {codigo: "$videojuegos.codigo"}, "stock": {$sum: "$videojuegos.stock"}}}
        ], (err, stocks) => {
            if(err) {
                return res.status(500).send({message: err.message});
            }
            res.json(stocks);
        });
    });

module.exports = router;