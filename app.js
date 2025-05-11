require('dotenv').config();
const express = require('express');
const FuncionarioDAO = require('./dao/FuncionarioDAO');
const GrupoFamiliarDAO = require('./dao/GrupoFamiliarDAO');
const mongoDBConnection = require('./confguracion/database'); // Corregí el nombre de la carpeta
const { DatabaseError, ValidationError, NotFoundError } = require('./dao/exeptions');

const app = express();

// Middlewares
app.use(express.json());

// Conexión a la base de datos al iniciar
async function initializeApp() {
  try {
    await mongoDBConnection.connect();
    console.log('Conexión a MongoDB establecida correctamente');
    
    // Inicializar DAOs
    await FuncionarioDAO.init();
    await GrupoFamiliarDAO.init();
    
    startServer();
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    process.exit(1);
  }
}

// Middleware para verificar conexión a DB en cada request
app.use(async (req, res, next) => {
  try {
    if (!mongoDBConnection.db) {
      await mongoDBConnection.connect();
    }
    next();
  } catch (error) {
    console.error('Error de conexión a MongoDB:', error);
    res.status(503).json({ 
      error: 'Service Unavailable', 
      message: 'Error al conectar con la base de datos' 
    });
  }
});

// Rutas de Funcionarios
app.post('/funcionarios', async (req, res, next) => {
  try {
    // Validación básica
    if (!req.body.numero_identificacion || !req.body.nombres || !req.body.apellidos) {
      throw new ValidationError('Campos requeridos: numero_identificacion, nombres, apellidos');
    }

    const nuevoFuncionario = await FuncionarioDAO.crear(req.body);
    res.status(201).json({
      success: true,
      data: nuevoFuncionario.toJSON(),
      message: 'Funcionario creado exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE - Eliminar funcionario
app.delete('/funcionarios/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    
    if (!id) {
      throw new ValidationError('Se requiere el ID del funcionario');
    }

    await FuncionarioDAO.eliminar(id);
    
    res.status(200).json({
      success: true,
      message: 'Funcionario eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

// PUT - Actualizar funcionario
app.put('/funcionarios/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    
     if (!id) {
      throw new ValidationError('Se requiere el ID del funcionario');
    }
    
    await FuncionarioDAO.actualizar(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Funcionario actualizado exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

// Rutas de Grupo Familiar
app.post('/grupo-familiar', async (req, res, next) => {
  try {
    // Validación básica
    if (!req.body.funcionario_id || !req.body.nombres || !req.body.apellidos || !req.body.parentesco) {
      throw new ValidationError('Campos requeridos: funcionario_id, nombres, apellidos, parentesco');
    }

    const nuevoMiembro = await GrupoFamiliarDAO.crear(req.body);
    res.status(201).json({
      success: true,
      data: nuevoMiembro.toJSON(),
      message: 'Miembro del grupo familiar creado exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

// Ruta para actualizar 
app.put('/grupo-familiar/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    
     if (!id) {
      throw new ValidationError('Se requiere el ID del grupo familiar');
    }
    
    await GrupoFamiliarDAO.actualizar(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Grupo familiar actualizado exitosamente'
    });
  } catch (error) {
    next(error);
  }
});
// Ruta para eliminar familiar
app.delete('/grupo-familiar/:id', async (req, res, next) => {
  try {
    // Validación mejorada
    if (!req.params.id) {
      throw new ValidationError('Se requiere el ID del miembro a eliminar');
    }

    // Verificar existencia antes de eliminar
    const existeMiembro = await GrupoFamiliarDAO.obtenerPorId(req.params.id);
    if (!existeMiembro) {
      throw new NotFoundError('Miembro del grupo familiar no encontrado');
    }

    // Eliminar usando el ID del parámetro de ruta
    const resultado = await GrupoFamiliarDAO.eliminar(req.params.id);

    // Respuesta apropiada para DELETE
    res.status(200).json({
      success: true,
      message: 'Miembro del grupo familiar eliminado exitosamente',
      deletedId: req.params.id
    });
    
  } catch (error) {
    next(error);
  }
});


// Ruta de verificación de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    db: mongoDBConnection.db ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});


// Cierre adecuado al terminar la aplicación
process.on('SIGINT', async () => {
  try {
    await mongoDBConnection.disconnect();
    console.log('Conexión a MongoDB cerrada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('Error al cerrar la conexión:', error);
    process.exit(1);
  }
});

// Iniciar el servidor
function startServer() {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
}

// Inicializar la aplicación
initializeApp();