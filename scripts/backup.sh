#!/bin/bash

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_PATH="${DB_PATH:-./backend/data/ispnoc.db}"
DATE=$(date +%Y%m%d-%H%M%S)
KEEP_DAYS=${KEEP_DAYS:-7}

mkdir -p "$BACKUP_DIR"

echo "🗄️  ISP NOC Manager - Backup"
echo "================================"
echo ""

if [ ! -f "$DB_PATH" ]; then
    echo "❌ Banco de dados não encontrado em: $DB_PATH"
    exit 1
fi

BACKUP_FILE="$BACKUP_DIR/ispnoc-backup-$DATE.db"

echo "📦 Criando backup do banco de dados..."
cp "$DB_PATH" "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✓ Backup criado: $BACKUP_FILE ($SIZE)"
else
    echo "❌ Erro ao criar backup"
    exit 1
fi

echo ""
echo "🧹 Limpando backups antigos (mantendo últimos $KEEP_DAYS dias)..."
find "$BACKUP_DIR" -name "ispnoc-backup-*.db" -mtime +$KEEP_DAYS -delete
echo "✓ Limpeza concluída"

echo ""
echo "📊 Backups disponíveis:"
ls -lh "$BACKUP_DIR"/ispnoc-backup-*.db 2>/dev/null || echo "  (nenhum backup encontrado)"

echo ""
echo "✅ Backup concluído com sucesso!"
echo ""
