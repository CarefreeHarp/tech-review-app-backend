/** Sustituye solo la persistencia para probar Sequelize y Express sin tocar PostgreSQL. */
export function installMemoryStore(sequelize) {
  const tables = new Map();
  const counters = new Map();
  const originals = [];
  const matches = (row, where = {}) => Object.entries(where).every(([key, value]) => row[key] === value);
  function constraintError(name) { const error = new Error(name); error.name = name; return error; }

  async function validate(model, row, current) {
    await model.build(row).validate();
    for (const [key, attribute] of Object.entries(model.rawAttributes)) {
      if (attribute.references && row[key] != null) {
        if (!tables.get(attribute.references.model)?.some(record => record[attribute.references.key] === row[key])) {
          throw constraintError('SequelizeForeignKeyConstraintError');
        }
      }
    }
    const uniqueKeys = [model.primaryKeyAttributes,
      ...Object.entries(model.rawAttributes).filter(([, attr]) => attr.unique).map(([key]) => [key]),
      ...model.options.indexes.filter(index => index.unique).map(index => index.fields)];
    for (const keys of uniqueKeys) {
      if (keys.length && keys.every(key => row[key] != null) && tables.get(model.name).some(other => other !== current && keys.every(key => other[key] === row[key]))) {
        throw constraintError('SequelizeUniqueConstraintError');
      }
    }
  }

  async function remove(model, row) {
    tables.set(model.name, tables.get(model.name).filter(other => other !== row));
    for (const child of Object.values(sequelize.models)) {
      for (const [key, attr] of Object.entries(child.rawAttributes)) {
        if (attr.references?.model !== model.name) continue;
        const dependents = tables.get(child.name).filter(record => record[key] === row[attr.references.key]);
        for (const dependent of dependents) {
          if (attr.onDelete === 'CASCADE') await remove(child, dependent);
          else if (attr.onDelete === 'SET NULL') dependent[key] = null;
          else if (dependents.length) throw constraintError('SequelizeForeignKeyConstraintError');
        }
      }
    }
  }

  async function instance(model, row, include = []) {
    const record = model.build({ ...row }, { isNewRecord: false });
    record.update = async payload => {
      const next = { ...row, ...payload };
      await validate(model, next, row);
      Object.assign(row, next);
      record.set(next);
      return record;
    };
    record.destroy = () => remove(model, row);
    for (const option of include) {
      const association = model.associations[option.as];
      if (!association) throw new Error(`Missing association ${model.name}.${option.as}`);
      const where = association.associationType === 'HasMany'
        ? { [association.foreignKey]: row[association.sourceKey] }
        : { [association.targetKey]: row[association.foreignKey] };
      const nested = await association.target.findAll({ where, include: option.include ?? [] });
      record.setDataValue(option.as, association.associationType === 'HasMany' ? nested : nested[0] ?? null);
    }
    return record;
  }

  for (const model of Object.values(sequelize.models)) {
    tables.set(model.name, []);
    counters.set(model.name, 1);
    for (const method of ['findAll', 'findByPk', 'findOne', 'findOrCreate', 'create', 'count']) {
      originals.push([model, method, model[method]]);
    }
    model.findAll = async (options = {}) => {
      let rows = tables.get(model.name).filter(row => matches(row, options.where));
      if (options.order) rows = [...rows].sort((a, b) => {
        for (const [key, direction] of options.order) {
          if (a[key] === b[key]) continue;
          return (a[key] < b[key] ? -1 : 1) * (direction === 'DESC' ? -1 : 1);
        }
        return 0;
      });
      return Promise.all(rows.map(row => instance(model, row, options.include)));
    };
    model.findOne = async options => (await model.findAll(options))[0] ?? null;
    model.findByPk = async (id, options = {}) => model.findOne({ ...options, where: { [model.primaryKeyAttributes[0]]: Number(id) } });
    model.count = async () => tables.get(model.name).length;
    model.create = async data => {
      const record = model.build(data);
      const row = record.get({ plain: true });
      for (const [key, attr] of Object.entries(model.rawAttributes)) {
        if (attr.autoIncrement && row[key] == null) {
          row[key] = counters.get(model.name);
          counters.set(model.name, row[key] + 1);
        }
      }
      await validate(model, row);
      tables.get(model.name).push(row);
      return instance(model, row);
    };
    model.findOrCreate = async ({ where, defaults }) => {
      const existing = await model.findOne({ where });
      return existing ? [existing, false] : [await model.create({ ...defaults, ...where }), true];
    };
  }
  return {
    tables,
    reset(firstId = 1) { for (const name of tables.keys()) { tables.set(name, []); counters.set(name, firstId); } },
    restore() { for (const [model, method, original] of originals) model[method] = original; },
  };
}
