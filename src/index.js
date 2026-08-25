const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
const PORT = 3000;
const dbPath = path.join(__dirname, '..', 'database.db');

async function iniciarBanco() {
  const db = await sqlite.open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.run(`
    CREATE TABLE IF NOT EXISTS livros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      autor TEXT NOT NULL,
      ano INTEGER,
      disponivel INTEGER DEFAULT 1
    )
  `);

  const total = await db.get('SELECT COUNT(*) AS total FROM livros');

  if (total.total === 0) {
    const livrosIniciais = [
      ['O Senhor dos Anéis', 'J.R.R. Tolkien', 1954, 1],
      ['1984', 'George Orwell', 1949, 0],
      ['Dom Casmurro', 'Machado de Assis', 1899, 1],
    ];

    for (const livro of livrosIniciais) {
      await db.run(
        'INSERT INTO livros (titulo, autor, ano, disponivel) VALUES (?, ?, ?, ?)',
        livro
      );
    }
  }

  return db;
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/livros', async (req, res) => {
  try {
    const livros = await db.all('SELECT * FROM livros ORDER BY id ASC');
    res.status(200).json(livros);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.post('/livros', async (req, res) => {
  try {
    const { titulo, autor, ano } = req.body;

    if (!titulo || !titulo.trim() || !autor || !autor.trim()) {
      return res.status(400).json({ erro: 'Título e autor são obrigatórios.' });
    }

    const livroCriado = await db.run(
      'INSERT INTO livros (titulo, autor, ano, disponivel) VALUES (?, ?, ?, 1)',
      [titulo.trim(), autor.trim(), ano || null]
    );

    const livro = await db.get(
      'SELECT * FROM livros WHERE id = ?',
      [livroCriado.lastID]
    );

    res.status(201).json(livro);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// ----- TAREFA 4: emprestar / devolver um livro (PUT) -----
app.put('/livros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { disponivel } = req.body;

    const livro = await db.get('SELECT * FROM livros WHERE id = ?', [id]);

    if (!livro) {
      return res.status(404).json({ erro: 'Livro não encontrado.' });
    }

    await db.run('UPDATE livros SET disponivel = ? WHERE id = ?', [disponivel, id]);

    const atualizado = await db.get('SELECT * FROM livros WHERE id = ?', [id]);
    res.status(200).json(atualizado);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.delete('/livros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const livroExistente = await db.get('SELECT * FROM livros WHERE id = ?', [id]);

    if (!livroExistente) {
      return res.status(404).json({ erro: 'Livro não encontrado.' });
    }

    await db.run('DELETE FROM livros WHERE id = ?', [id]);
    res.status(200).json({ mensagem: 'Livro removido com sucesso.' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

(async () => {
  try {
    db = await iniciarBanco();
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error.message);
    process.exit(1);
  }
})();
