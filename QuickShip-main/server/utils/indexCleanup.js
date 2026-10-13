async function dropDuplicateIndexes(sequelize) {
    const schema = sequelize.config.database;
    const [rows] = await sequelize.query(
        'SELECT table_name AS tableName, index_name AS indexName, column_name AS columnName, non_unique AS nonUnique, seq_in_index AS seq ' +
        'FROM information_schema.statistics WHERE table_schema = ? ORDER BY table_name, index_name, seq_in_index',
        { replacements: [schema] }
    );

    const byIndex = new Map();
    for (const r of rows) {
        const key = `${r.tableName}::${r.indexName}`;
        if (!byIndex.has(key)) byIndex.set(key, { table: r.tableName, name: r.indexName, columns: [], unique: Number(r.nonUnique) === 0 });
        byIndex.get(key).columns.push(r.columnName);
    }

    const indexes = Array.from(byIndex.values());
    let dropped = 0;

    for (const idx of indexes) {
        if (!idx.unique || idx.columns.length !== 1 || idx.name === 'PRIMARY') continue;
        const column = idx.columns[0];
        const match = /^(.+)_(\d+)$/.exec(idx.name);
        if (!match || match[1] !== column) continue;

        const original = indexes.find(o => o.table === idx.table && o.name === column && o.unique && o.columns.length === 1 && o.columns[0] === column);
        if (!original) continue;

        try {
            await sequelize.query(`ALTER TABLE \`${idx.table}\` DROP INDEX \`${idx.name}\``);
            dropped++;
        } catch (err) {
            console.error(`[INDEX CLEANUP] Could not drop ${idx.table}.${idx.name}:`, err.message);
        }
    }

    if (dropped > 0) console.log(`[INDEX CLEANUP] Removed ${dropped} duplicate index(es).`);
    return dropped;
}

module.exports = { dropDuplicateIndexes };
