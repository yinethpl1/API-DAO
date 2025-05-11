const mongoDBConnection = require('../confguracion/database');

class CustomError extends Error {
  constructor(message, type, statusCode, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }
}

class DatabaseError extends CustomError {
  constructor(message, details = {}) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

class ValidationError extends CustomError {
  constructor(message, details = {}) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

class NotFoundError extends CustomError {
  constructor(message, details = {}) {
    super(message, 'NOT_FOUND_ERROR', 404, details);
  }
}

class UnauthorizedError extends CustomError {
  constructor(message, details = {}) {
    super(message, 'UNAUTHORIZED_ERROR', 401, details);
  }
}

class ExceptionsDAO {
  static async init() {
    try {
      this.db = await mongoDBConnection.connect();
      this.collection = this.db.collection('system_errors');
      
      // Crear índices para búsquedas eficientes
      await this.collection.createIndex({ type: 1 });
      await this.collection.createIndex({ timestamp: -1 });
      await this.collection.createIndex({ 'details.route': 1 });
      
      console.log('ExceptionsDAO inicializado correctamente');
    } catch (error) {
      console.error('Error al inicializar ExceptionsDAO:', error);
      throw new DatabaseError('Error al conectar con la base de datos');
    }
  }

  /**
   * Registra un error en la base de datos
   * @param {Error} error - Objeto de error
   * @param {Object} context - Contexto adicional (req, userId, etc.)
   * @returns {Promise<Object>} - Documento insertado
   */
  static async logError(error, context = {}) {
    try {
      const errorDoc = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        type: error.type || 'UNKNOWN_ERROR',
        statusCode: error.statusCode || 500,
        details: {
          ...error.details,
          route: context.route,
          method: context.method,
          userId: context.userId
        },
        timestamp: new Date()
      };

      const result = await this.collection.insertOne(errorDoc);
      return { ...errorDoc, _id: result.insertedId };
    } catch (loggingError) {
      console.error('Error al registrar excepción:', loggingError);
      // Si falla el logging, al menos mostrar en consola
      console.error('Error original:', error);
      return null;
    }
  }

  /**
   * Obtiene errores paginados
   * @param {Object} filters - Filtros de búsqueda
   * @param {number} page - Página actual
   * @param {number} limit - Límite por página
   * @returns {Promise<Object>} - Errores y metadatos de paginación
   */
  static async getPaginatedErrors(filters = {}, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const query = this._buildQuery(filters);
      
      const [errors, total] = await Promise.all([
        this.collection.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        this.collection.countDocuments(query)
      ]);

      return {
        errors,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new DatabaseError(`Error al obtener errores: ${error.message}`);
    }
  }

  /**
   * Construye query de búsqueda basado en filtros
   * @private
   */
  static _buildQuery(filters) {
    const query = {};
    
    if (filters.type) {
      query.type = filters.type;
    }
    
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }
    
    if (filters.route) {
      query['details.route'] = { $regex: filters.route, $options: 'i' };
    }
    
    if (filters.statusCode) {
      query.statusCode = parseInt(filters.statusCode);
    }
    
    return query;
  }

  /**
   * Obtiene estadísticas de errores
   * @returns {Promise<Object>} - Estadísticas agregadas
   */
  static async getErrorStats() {
    try {
      const pipeline = [
        {
          $facet: {
            errorTypes: [
              { $group: { _id: "$type", count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            routes: [
              { $match: { 'details.route': { $exists: true } } },
              { $group: { _id: "$details.route", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ],
            recentErrors: [
              { $sort: { timestamp: -1 } },
              { $limit: 5 }
            ],
            dailyCount: [
              { 
                $group: { 
                  _id: { 
                    $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } 
                  }, 
                  count: { $sum: 1 } 
                } 
              },
              { $sort: { _id: 1 } },
              { $limit: 30 }
            ]
          }
        }
      ];

      const result = await this.collection.aggregate(pipeline).toArray();
      return result[0] || {};
    } catch (error) {
      throw new DatabaseError(`Error al obtener estadísticas: ${error.message}`);
    }
  }
}

// Inicialización automática al cargar el módulo
ExceptionsDAO.init().catch(err => {
  console.error('Error inicializando ExceptionsDAO:', err);
});

module.exports = {
  DatabaseError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  CustomError,
  ExceptionsDAO
};