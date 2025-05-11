class InformacionAcademica {
  constructor({
    _id,
    funcionario_id,
    universidad,
    nivel_estudio,
    titulo_estudio,
    fecha_graduacion,
    created_at = new Date()
  }) {
    this._id = _id;
    this.funcionario_id = funcionario_id;
    this.universidad = universidad;
    this.nivel_estudio = nivel_estudio;
    this.titulo_estudio = titulo_estudio;
    this.fecha_graduacion = fecha_graduacion;
    this.created_at = created_at;
  }

  toJSON() {
    return {
      id: this._id,
      funcionario_id: this.funcionario_id,
      universidad: this.universidad,
      nivel_estudio: this.nivel_estudio,
      titulo_estudio: this.titulo_estudio,
      fecha_graduacion: this.fecha_graduacion,
      created_at: this.created_at
    };
  }
}

module.exports = InformacionAcademica;