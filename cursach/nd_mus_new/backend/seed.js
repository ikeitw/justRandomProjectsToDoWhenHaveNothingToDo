const {
    sequelize,
    Musician,
    Ensemble,
    Composition,
    Record,
    Performance
} = require('./models');

async function seed() {
    try {
        await sequelize.sync({ force: true });

        await Promise.all([
            Performance.destroy({ where: {} }),
            Composition.destroy({ where: {} }),
            Ensemble.destroy({ where: {} }),
            Record.destroy({ where: {} }),
            Musician.destroy({ where: {} })
        ]);

        const musicians = await Musician.bulkCreate([
            { fullName: 'Ludwig van Beethoven', role: 'composer' },
            { fullName: 'Wolfgang Amadeus Mozart', role: 'composer' },
            { fullName: 'Johann Sebastian Bach', role: 'composer' },
            { fullName: 'Clara Schumann', role: 'performer' },
            { fullName: 'Itzhak Perlman', role: 'performer' },
            { fullName: 'Leonard Bernstein', role: 'conductor' },
            { fullName: 'Miles Davis', role: 'performer' },
            { fullName: 'Duke Ellington', role: 'leader' },
            { fullName: 'Yo-Yo Ma', role: 'performer' },
            { fullName: 'Franz Liszt', role: 'composer' }
        ]);

        const ensembles = await Ensemble.bulkCreate([
            { name: 'Berlin Philharmonic', type: 'orchestra' },
            { name: 'Vienna Quartet', type: 'quartet' },
            { name: 'Jazz Masters', type: 'jazz band' },
            { name: 'London Symphony', type: 'orchestra' },
            { name: 'String Fusion', type: 'ensemble' }
        ]);

        const compositions = await Composition.bulkCreate([
            { title: 'Symphony No.5', composerId: musicians[0].id },
            { title: 'Requiem', composerId: musicians[1].id },
            { title: 'Cello Suite No.1', composerId: musicians[2].id },
            { title: 'Piano Concerto', composerId: musicians[9].id },
            { title: 'Kinderszenen', composerId: musicians[3].id }
        ]);

        const records = await Record.bulkCreate([
            {
                label: 'EMI',
                mediaType: 'cd',
                releaseDate: '2022-01-01',
                wholesalePrice: 8,
                retailPrice: 15,
                soldLastYear: 100,
                soldThisYear: 150,
                stock: 40
            },
            {
                label: 'Sony Classical',
                mediaType: 'vinyl',
                releaseDate: '2023-03-15',
                wholesalePrice: 10,
                retailPrice: 18,
                soldLastYear: 80,
                soldThisYear: 95,
                stock: 30
            },
            {
                label: 'Deutsche Grammophon',
                mediaType: 'cassette',
                releaseDate: '2021-11-20',
                wholesalePrice: 9,
                retailPrice: 17,
                soldLastYear: 120,
                soldThisYear: 200,
                stock: 50
            },
            {
                label: 'Blue Note',
                mediaType: 'floppy',
                releaseDate: '2023-06-10',
                wholesalePrice: 7,
                retailPrice: 14,
                soldLastYear: 60,
                soldThisYear: 100,
                stock: 25
            },
            {
                label: 'Philips',
                mediaType: 'digital',
                releaseDate: '2024-01-05',
                wholesalePrice: 6,
                retailPrice: 12,
                soldLastYear: 50,
                soldThisYear: 80,
                stock: 35
            }
        ]);

        const performances = await Performance.bulkCreate([
            { compositionId: compositions[0].id, ensembleId: ensembles[0].id, recordId: records[0].id },
            { compositionId: compositions[0].id, ensembleId: ensembles[1].id, recordId: records[1].id },
            { compositionId: compositions[1].id, ensembleId: ensembles[0].id, recordId: records[2].id },
            { compositionId: compositions[2].id, ensembleId: ensembles[4].id, recordId: records[2].id },
            { compositionId: compositions[3].id, ensembleId: ensembles[2].id, recordId: records[3].id },
            { compositionId: compositions[4].id, ensembleId: ensembles[3].id, recordId: records[4].id }
        ]);

        await sequelize.query(`
            CREATE OR REPLACE FUNCTION get_ensemble_compositions_count(ens_id INT)
            RETURNS INT AS $$
            BEGIN
                RETURN (
                    SELECT COUNT(DISTINCT p."compositionId")
                    FROM "Performances" p
                    WHERE p."ensembleId" = ens_id
                );
            END;
            $$ LANGUAGE plpgsql;
        `);

        await sequelize.query(`
            CREATE OR REPLACE FUNCTION get_ensemble_records(ens_id INT)
            RETURNS TABLE(title TEXT) AS $$
            BEGIN
                RETURN QUERY
                SELECT DISTINCT r.label
                FROM "Performances" p
                JOIN "Records" r ON r.id = p."recordId"
                WHERE p."ensembleId" = ens_id;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await sequelize.query(`
            CREATE OR REPLACE FUNCTION top_selling_records()
            RETURNS TABLE(label TEXT, sold INT) AS $$
            BEGIN
                RETURN QUERY
                SELECT r.label::TEXT, r."soldThisYear" as sold
                FROM "Records" r
                WHERE r."soldThisYear" = (SELECT MAX("soldThisYear") FROM "Records");
            END;
            $$ LANGUAGE plpgsql;
        `);

        await sequelize.query(`
            CREATE OR REPLACE FUNCTION update_stock_after_delete()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE "Records"
                SET stock = stock - 1
                WHERE id = OLD."recordId";
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await sequelize.query(`
            DROP TRIGGER IF EXISTS trg_update_stock ON "Performances";
            CREATE TRIGGER trg_update_stock
            AFTER DELETE ON "Performances"
            FOR EACH ROW
            EXECUTE PROCEDURE update_stock_after_delete();
        `);

        console.log('✅ Seed complete: таблицы, данные, функции, триггеры');
    } catch (err) {
        console.error('❌ Ошибка в seed.js:', err);
    } finally {
        await sequelize.close();
    }
}

seed();
