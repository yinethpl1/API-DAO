const mongoDBConnection = require('../confguracion/database');
const Funcionario = require('../models/Funcionario');
const { DatabaseError, ValidationError, NotFoundError } = require('./exeptions');
const { ObjectId } = require('mongodb');

class FuncionarioDAO {
  static async init() {
    try {
      this.db = await mongoDBConnection.connect();
      this.collection = this.db.collection('funcionarios');
      
      // Crear índices
      await this.collection.createIndex({ numero_identificacion: 1 }, { unique: true });
      console.log('Índices creados para funcionarios');
    } catch (error) {
      console.error('Error al inicializar FuncionarioDAO:', error);
      throw new DatabaseError('Error al conectar con la base de datos');
    }
  }

  static async crear(funcionarioData) {
    try {
      const funcionario = new Funcionario(funcionarioData);
      const errores = funcionario.validar();
      
      if (errores.length > 0) {
        throw new ValidationError(errores.join(', '));
      }

      const result = await this.collection.insertOne(funcionario);
      return new Funcionario({ ...funcionario, _id: result.insertedId });
    } catch (error) {
      if (error.code === 11000) {
        throw new ValidationError('Ya existe un funcionario con este número de identificación');
      }
      throw new DatabaseError(`Error al crear funcionario: ${error.message}`);
    }
  }

  static async obtenerTodos() {
    try {
      const cursor = this.collection.find().sort({ apellidos: 1, nombres: 1 });
      const funcionarios = await cursor.toArray();
      return funcionarios.map(f => new Funcionario(f));
    } catch (error) {
      throw new DatabaseError(`Error al obtener funcionarios: ${error.message}`);
    }
  }

  static async obtenerPorId(id) {
    try {
      const funcionario = await this.collection.findOne({ _id: id });
      
      if (!funcionario) {
        throw new NotFoundError(`Funcionario con ID ${id} no encontrado`);
      }

      return new Funcionario(funcionario);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Error al obtener funcionario: ${error.message}`);
    }
  }

  static async eliminar(id) {
    const objectId = new ObjectId(id);
  try {
    if (!id) {
      throw new ValidationError('Se requiere el ID del funcionario para eliminar');
    }

    const result = await this.collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      throw new NotFoundError(`Funcionario con ID ${id} no encontrado`);
    }

    return true;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseError(`Error al eliminar funcionario: ${error.message}`);
  }
}

static async actualizar(id, nuevosDatos) {
  try {
    const { ObjectId } = require('mongodb');

    // Validar y convertir ID
    if (!ObjectId.isValid(id)) {
      throw new ValidationError('ID inválido');
    }
    const objectId = new ObjectId(id);

    // Obtener y validar documento existente
    const funcionarioExistente = await this.obtenerPorId(objectId);
    
    // Crear instancia con datos combinados
    const datosCombinados = { ...funcionarioExistente, ...nuevosDatos };
    const funcionarioActualizado = new Funcionario(datosCombinados);
    
    // Validaciones...
    
    // Operación de actualización
    const result = await this.collection.findOneAndUpdate(
      { _id: objectId },
      { $set: nuevosDatos },
      { 
        returnDocument: 'after',
        projection: {} // Asegurar todos los campos
      }
    );

    // Verificación robusta
    if (!result?.value) {
      throw new NotFoundError('Documento no encontrado después de actualizar');
    }

    // Crear nueva instancia con datos actualizados
    return new Funcionario(result.value);
    
  } catch (error) {
    // Manejo de errores...
  }
}
}

// Inicializar la conexión al cargar el módulo
FuncionarioDAO.init().catch(err => {
  console.error('Error inicializando FuncionarioDAO:', err);
  process.exit(1);
});

module.exports = FuncionarioDAO;