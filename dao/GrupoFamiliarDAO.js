const mongoDBConnection = require('../confguracion/database'); // Corregido el nombre de la carpeta
const GrupoFamiliar = require('../models/GrupoFamiliar');
const { DatabaseError, ValidationError, NotFoundError } = require('./exeptions'); // Corregido el nombre del archivo
const { ObjectId } = require('mongodb');

class GrupoFamiliarDAO {
  static async init() {
    try {
      this.db = await mongoDBConnection.connect();
      this.collection = this.db.collection('grupo_familiar');
      
      // Crear índices para mejorar el rendimiento
      await this.collection.createIndex({ funcionario_id: 1 });
      await this.collection.createIndex({ parentesco: 1 });
      await this.collection.createIndex({ 'nombres': 'text', 'apellidos': 'text' });
      console.log('GrupoFamiliarDAO inicializado correctamente');
    } catch (error) {
      console.error('Error al inicializar GrupoFamiliarDAO:', error);
      throw new DatabaseError('Error al conectar con la base de datos');
    }
  }

  /**
   * Crea un nuevo miembro del grupo familiar
   * @param {Object} grupoFamiliarData - Datos del familiar
   * @returns {Promise<GrupoFamiliar>} - Instancia del modelo GrupoFamiliar
   */
  static async crear(grupoFamiliarData) {
    try {
      // Validar datos de entrada antes de crear la instancia
      if (!grupoFamiliarData || typeof grupoFamiliarData !== 'object') {
        throw new ValidationError('El ID del funcionario es requerido');
      }

      const grupoFamiliar = new GrupoFamiliar(grupoFamiliarData);
      
      //***Error porque no esta creado el metodo validar en GrupoFamiliar***

     // Validar la instancia del grupo familiar
/*if (typeof grupoFamiliar.validar !== 'function') {
  throw new DatabaseError('El modelo GrupoFamiliar no tiene método validar()');
}

if (!grupoFamiliar.validar || typeof grupoFamiliar.validar !== 'function') {
  throw new DatabaseError('Error de configuración del modelo GrupoFamiliar');
}

if (erroresValidacion.length > 0) {
  throw new ValidationError(
    'Datos del grupo familiar no válidos: ' + erroresValidacion.join(', '),
    { detalles: erroresValidacion }
  );
}

// Verificar que el funcionario exista en la base de datos
if (!grupoFamiliar.funcionario_id) {
  throw new ValidationError('El ID del funcionario es requerido');
}

try {
  const funcionariosCollection = this.db.collection('funcionarios');
  const funcionario = await funcionariosCollection.findOne({ 
    _id: grupoFamiliar.funcionario_id 
  });
  
  if (!funcionario) {
    throw new NotFoundError(
      `No se encontró el funcionario con ID: ${grupoFamiliar.funcionario_id}`,
      { funcionario_id: grupoFamiliar.funcionario_id }
    );
  }
} catch (error) {
  if (error instanceof NotFoundError) {
    throw error;
  }
  throw new DatabaseError(
    'Error al verificar el funcionario en la base de datos',
    { causa: error.message }
  );
}*/

      // Preparar documento para MongoDB
      const documento = {
        funcionario_id: grupoFamiliar.funcionario_id,
        nombres: grupoFamiliar.nombres,
        apellidos: grupoFamiliar.apellidos,
        rol: grupoFamiliar.rol || 'Familiar',
        parentesco: grupoFamiliar.parentesco,
        fecha_nacimiento: grupoFamiliar.fecha_nacimiento,
        created_at: new Date()
      };

      const result = await this.collection.insertOne(documento);
      
      return new GrupoFamiliar({ 
        ...documento,
        _id: result.insertedId 
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error en GrupoFamiliarDAO.crear:', error);
      throw new DatabaseError('Error al crear miembro del grupo familiar');
    }
  }

  /**
   * Obtiene un miembro del grupo familiar por su ID
   * @param {string} id - ID del familiar
   * @returns {Promise<GrupoFamiliar>}
   */
  static async obtenerPorId(id) {
    try {
      if (!ObjectId.isValid(id)) {
        throw new ValidationError('ID no válido');
      }

      const result = await this.collection.findOne({ 
        _id: new ObjectId(id) // Conversión necesaria
      });
      
      if (!result) {
        throw new NotFoundError('Miembro del grupo familiar no encontrado');
      }
      
      return new GrupoFamiliar(result);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error en GrupoFamiliarDAO.obtenerPorId:', error);
      throw new DatabaseError('Error al obtener miembro del grupo familiar');
    }
  }

  /**
   * Obtiene todos los familiares de un funcionario
   * @param {string} funcionarioId - ID del funcionario
   * @returns {Promise<Array<GrupoFamiliar>>}
   */
  static async obtenerPorFuncionario(funcionarioId) {
    try {
      if (!funcionarioId) {
        throw new ValidationError('ID del funcionario es requerido');
      }

      const cursor = this.collection.find({ funcionario_id: funcionarioId })
        .sort({ created_at: -1 });
      
      const resultados = await cursor.toArray();
      return resultados.map(item => new GrupoFamiliar(item));
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error en GrupoFamiliarDAO.obtenerPorFuncionario:', error);
      throw new DatabaseError('Error al obtener grupo familiar');
    }
  }

  /**
   * Actualiza un miembro del grupo familiar
   * @param {string} id - ID del familiar a actualizar
   * @param {Object} datosActualizados - Campos a actualizar
   * @returns {Promise<GrupoFamiliar>}
   */
  static async actualizar(id, datosActualizados) {
  const { ObjectId } = require("mongodb");

  try {
    // 1. Validación de formato de ID
    if (!ObjectId.isValid(id)) {
      throw new ValidationError("ID inválido - Formato incorrecto");
    }
    const objectId = new ObjectId(id);

    // 2. Verificar existencia del documento
    const documentoExistente = await this.collection.findOne({ _id: objectId });
    if (!documentoExistente) {
      throw new NotFoundError("El registro no existe");
    }

    // 3. Filtrar y validar campos
    const camposProhibidos = ["_id", "funcionario_id", "created_at"];
    const camposValidos = Object.entries(datosActualizados).reduce((acc, [key, val]) => {
      if (!camposProhibidos.includes(key)) {
        if (key === "fecha_nacimiento") {
          const fecha = new Date(val);
          if (isNaN(fecha.getTime())) {
            throw new ValidationError("Formato de fecha inválido (Use YYYY-MM-DD)");
          }
          acc[key] = fecha;
        } else {
          acc[key] = val;
        }
      }
      return acc;
    }, {});

    // 4. Verificar cambios reales
    const cambiosReales = Object.keys(camposValidos).filter(key => {
      const valorExistente = documentoExistente[key];
      const valorNuevo = camposValidos[key];
      
      // Comparación especial para fechas
      if (valorExistente instanceof Date && valorNuevo instanceof Date) {
        return valorExistente.getTime() !== valorNuevo.getTime();
      }
      return JSON.stringify(valorNuevo) !== JSON.stringify(valorExistente);
    });

    if (cambiosReales.length === 0) {
      throw new ValidationError("No se detectaron cambios válidos");
    }

    // 5. Ejecutar actualización
    const result = await this.collection.findOneAndUpdate(
      { _id: objectId },
      { 
        $set: { 
          ...camposValidos,
          updated_at: new Date() 
        } 
      },
      { 
        returnDocument: "after",
        projection: { _id: 0, funcionario_id: 0 }
      }
    );

    // 6. Verificar y preparar respuesta
    if (!result.value) {
      console.error("Error en actualización:", {
        operacion: "update",
        error: "Documento no modificado"
      });
      throw new DatabaseError("Error persistencia datos");
    }

    // 7. Serializar fechas a ISO String
    const responseData = Object.fromEntries(
      Object.entries(result.value).map(([key, value]) => [
        key,
        value instanceof Date ? value.toISOString() : value
      ])
    );

    return responseData;

  } catch (error) {
    // 8. Manejo mejorado de errores
    if (error.name === "MongoServerError") {
      console.error("Error MongoDB:", {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      if (error.code === 121) {
        const errorDetails = error.errInfo?.details;
        const mensaje = errorDetails 
          ? `Error validación esquema: ${JSON.stringify(errorDetails)}`
          : "Datos no cumplen validación de esquema";
        throw new ValidationError(mensaje);
      }
      throw new DatabaseError("Error operación base de datos");
    }

    // 9. Registrar error completo
    console.error("Error en capa DAO:", {
      error: error.stack,
      inputData: datosActualizados,
      timestamp: new Date().toISOString()
    });

    throw error;
  }
}
  /**
   * Elimina un miembro del grupo familiar
   * @param {string} id - ID del familiar a eliminar
   * @returns {Promise<boolean>}
   */
 static async eliminar(id) {
  try {
    // Validar formato del ID
    if (!ObjectId.isValid(id)) {
      throw new ValidationError(`ID ${id} no es válido. Debe ser un ObjectId de MongoDB.`);
    }

    const objectId = new ObjectId(id);

    // Verificar existencia
    const existe = await this.collection.findOne({ _id: objectId });
    if (!existe) {
      throw new NotFoundError("El miembro no existe");
    }

    // Eliminar
    const result = await this.collection.deleteOne({ _id: objectId });
    
    if (result.deletedCount === 0) {
      throw new DatabaseError("No se pudo eliminar el registro");
    }

    return { deleted: true, id };

  } catch (error) {
    console.error(`Error al eliminar ID ${id}:`, error);
    throw error; // Propaga el error
  }
}
  /**
   * Busca miembros del grupo familiar por criterios
   * @param {Object} criterios - Campos de búsqueda
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array<GrupoFamiliar>>}
   */
  static async buscar(criterios = {}, limite = 20) {
    try {
      const query = {};
      
      if (criterios.funcionario_id) {
        query.funcionario_id = criterios.funcionario_id;
      }
      
      if (criterios.parentesco) {
        query.parentesco = { $regex: criterios.parentesco, $options: 'i' };
      }
      
      if (criterios.texto) {
        query.$text = { $search: criterios.texto };
      }
      
      const cursor = this.collection.find(query)
        .limit(limite)
        .sort({ created_at: -1 });
      
      const resultados = await cursor.toArray();
      return resultados.map(item => new GrupoFamiliar(item));
    } catch (error) {
      console.error('Error en GrupoFamiliarDAO.buscar:', error);
      throw new DatabaseError('Error al buscar miembros del grupo familiar');
    }
  }
}

// Inicialización automática al cargar el módulo
GrupoFamiliarDAO.init().catch(err => {
  console.error('Error inicializando GrupoFamiliarDAO:', err);
  process.exit(1);
});

module.exports = GrupoFamiliarDAO;