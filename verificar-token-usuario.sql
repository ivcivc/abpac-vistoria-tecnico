-- Script para verificar o token específico do usuário
-- Token: 1da66df8d2b911ed2007a7923ae6b79ce8eb6067ad7308453976e5cd3e7427cf

SET @user_token = '1da66df8d2b911ed2007a7923ae6b79ce8eb6067ad7308453976e5cd3e7427cf';

-- 1. Verificar se existe nas possíveis tabelas
SELECT 'Verificando existência do token...' AS status;

-- Tabela estoque_remessa (CORRETA conforme backend)
SELECT 
    'estoque_remessa' AS tabela,
    COUNT(*) AS encontrado
FROM estoque_remessa 
WHERE token_vistoria = @user_token;

-- Verificar se existe uma tabela estoque_vistoria (mencionada pelo usuário)
SELECT 
    'Tabelas relacionadas a vistoria:' AS info,
    TABLE_NAME AS nome_tabela
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME LIKE '%vistoria%'
ORDER BY TABLE_NAME;

-- 2. Se encontrado na estoque_remessa, mostrar dados completos
SELECT 
    '=== DADOS DA VISTORIA (estoque_remessa) ===' AS secao,
    er.id,
    er.status,
    er.token_vistoria,
    er.equipamento_id,
    er.tecnico_id,
    er.local_vistoria,
    er.cidade,
    er.endereco,
    er.tipo_vistoria,
    er.data_prevista,
    er.observacoes_vistoria,
    er.created_at,
    er.updated_at
FROM estoque_remessa er
WHERE er.token_vistoria = @user_token;

-- 3. Verificar dados do equipamento relacionado
SELECT 
    '=== DADOS DO EQUIPAMENTO ===' AS secao,
    e.id,
    e.nome,
    e.placa,
    e.modelo,
    e.marca,
    e.cor,
    e.numero_chassi,
    e.ano_fabricacao
FROM estoque_remessa er
JOIN equipamentos e ON er.equipamento_id = e.id
WHERE er.token_vistoria = @user_token;

-- 4. Verificar dados do técnico (se definido)
SELECT 
    '=== DADOS DO TÉCNICO ===' AS secao,
    p.id,
    p.nome,
    p.email,
    p.tipo,
    p.ativo
FROM estoque_remessa er
LEFT JOIN pessoas p ON er.tecnico_id = p.id
WHERE er.token_vistoria = @user_token;

-- 5. Verificar itens da vistoria
SELECT 
    '=== ITENS DA VISTORIA ===' AS secao,
    COUNT(*) AS total_itens
FROM estoque_remessa er
LEFT JOIN estoque_remessa_itens eri ON er.id = eri.estoque_remessa_id
WHERE er.token_vistoria = @user_token;

-- 6. Mostrar estrutura completa que seria retornada pelo endpoint
SELECT 
    '=== ESTRUTURA COMPLETA PARA O ENDPOINT ===' AS secao,
    JSON_OBJECT(
        'id', er.id,
        'status', er.status,
        'endereco', COALESCE(er.endereco, er.local_vistoria),
        'local_vistoria', er.local_vistoria,
        'cidade', er.cidade,
        'data_agendada', er.data_prevista,
        'tipo_vistoria', er.tipo_vistoria,
        'equipamento', IF(e.id IS NOT NULL, JSON_OBJECT(
            'id', e.id,
            'nome', e.nome,
            'placa', e.placa,
            'modelo', e.modelo,
            'marca', e.marca,
            'cor', e.cor
        ), NULL),
        'tecnico', IF(p.id IS NOT NULL, JSON_OBJECT(
            'id', p.id,
            'nome', p.nome,
            'email', p.email
        ), NULL)
    ) AS estrutura_json
FROM estoque_remessa er
LEFT JOIN equipamentos e ON er.equipamento_id = e.id
LEFT JOIN pessoas p ON er.tecnico_id = p.id
WHERE er.token_vistoria = @user_token;

-- 7. Diagnóstico de problemas potenciais
SELECT 
    '=== DIAGNÓSTICO ===' AS secao,
    CASE 
        WHEN er.id IS NULL THEN 'Token não encontrado na tabela estoque_remessa'
        WHEN er.equipamento_id IS NULL THEN 'Equipamento não definido'
        WHEN e.id IS NULL THEN 'Equipamento não encontrado (referência quebrada)'
        WHEN er.status NOT IN ('AGUARDANDO_VISTORIA', 'EM_VISTORIA', 'AGUARDANDO_APROVACAO') THEN CONCAT('Status não permite acesso: ', er.status)
        WHEN er.local_vistoria IS NULL AND er.endereco IS NULL THEN 'Local da vistoria não informado'
        ELSE 'Dados parecem corretos - verificar logs do backend'
    END AS diagnostico
FROM estoque_remessa er
LEFT JOIN equipamentos e ON er.equipamento_id = e.id
WHERE er.token_vistoria = @user_token
UNION ALL
SELECT 
    '=== DIAGNÓSTICO ===' AS secao,
    'Token não encontrado em nenhuma tabela' AS diagnostico
WHERE NOT EXISTS (
    SELECT 1 FROM estoque_remessa WHERE token_vistoria = @user_token
);

-- 8. Verificar logs de acesso (se existir tabela de log)
SELECT 
    '=== LOGS DE ACESSO (se existir) ===' AS secao,
    COUNT(*) AS total_acessos
FROM estoque_remessa_log erl
JOIN estoque_remessa er ON erl.estoque_remessa_id = er.id
WHERE er.token_vistoria = @user_token; 