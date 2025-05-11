class GrupoFamiliar {
  constructor({
    _id,
    funcionario_id,
    nombres,
    apellidos,
    parentesco,
    fecha_nacimiento,
    created_at = new Date()
  }) {
    this._id = _id;
    this.funcionario_id = funcionario_id;
    this.nombres = nombres;
    this.apellidos = apellidos;
    this.parentesco = parentesco;
    this.fecha_nacimiento = fecha_nacimiento;
    this.created_at = created_at;
  }


  toJSON() {
    return {
      id: this._id,
      funcionario_id: this.funcionario_id,
      nombres: this.nombres,
      apellidos: this.apellidos,
      parentesco: this.parentesco,
      fecha_nacimiento: this.fecha_nacimiento,
      created_at: this.created_at
    };
  }
}

module.exports = GrupoFamiliar;