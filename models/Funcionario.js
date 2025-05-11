class Funcionario {
  constructor({
    _id,
    tipo_identificacion,
    numero_identificacion,
    nombres,
    apellidos,
    estado_civil,
    sexo,
    direccion,
    telefono,
    fecha_nacimiento,
    created_at = new Date(),
    updated_at = new Date()
  }) {
    this._id = _id;
    this.tipo_identificacion = tipo_identificacion;
    this.numero_identificacion = numero_identificacion;
    this.nombres = nombres;
    this.apellidos = apellidos;
    this.estado_civil = estado_civil;
    this.sexo = sexo;
    this.direccion = direccion;
    this.telefono = telefono;
    this.fecha_nacimiento = fecha_nacimiento;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  validar() {
    const errores = [];
    
    if (!this.tipo_identificacion) errores.push('Tipo de identificación es requerido');
    if (!this.numero_identificacion) errores.push('Número de identificación es requerido');
    if (!this.nombres) errores.push('Nombres son requeridos');
    if (!this.apellidos) errores.push('Apellidos son requeridos');
    
    return errores;
  }

  toJSON() {
    return {
      id: this._id,
      tipo_identificacion: this.tipo_identificacion,
      numero_identificacion: this.numero_identificacion,
      nombres: this.nombres,
      apellidos: this.apellidos,
      estado_civil: this.estado_civil,
      sexo: this.sexo,
      direccion: this.direccion,
      telefono: this.telefono,
      fecha_nacimiento: this.fecha_nacimiento,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Funcionario;