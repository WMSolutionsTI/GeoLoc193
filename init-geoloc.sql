-- init-geoloc-simplificado.sql
-- Script de inicialização do banco de dados para produção
-- Versão simplificada e corrigida

-- 1. Encerrar conexões antigas
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'geoloc_bombeiros'
   OR usename = 'geoloc_user_postgres';

-- 2. Apagar o banco (se existir)
DROP DATABASE IF EXISTS geoloc_bombeiros;

-- 3. Apagar objetos pertencentes ao usuário (se existir)
DROP OWNED BY geoloc_user_postgres;

-- 4. Apagar usuário (se existir)
DROP ROLE IF EXISTS geoloc_user_postgres;

-- 5. Criar usuário limpo
CREATE ROLE geoloc_user_postgres LOGIN PASSWORD 'tWYkjxz2FCVVjEnKZIXUcKCVgPwFMBYp';

-- 6. Criar banco COM esse usuário como owner
CREATE DATABASE geoloc_bombeiros OWNER geoloc_user_postgres;

-- 7. Conectar ao banco
\c geoloc_bombeiros

-- 8. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 9. Permissões
GRANT ALL PRIVILEGES ON DATABASE geoloc_bombeiros TO geoloc_user_postgres;
GRANT USAGE, CREATE ON SCHEMA public TO geoloc_user_postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO geoloc_user_postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO geoloc_user_postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO geoloc_user_postgres;

-- ====================== TABELAS PRINCIPAIS ======================

-- Users table - stores all system users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'ADMINISTRADOR', 'SUPERVISOR', 'ATENDENTE'
    pa VARCHAR(100), -- Posto de Atendimento
    active BOOLEAN DEFAULT TRUE,
    session_token VARCHAR(255), -- For single session control
    allowed_apps JSONB DEFAULT '[]'::jsonb, -- List of app slugs the user can access
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Apps table - stores available apps in the system
CREATE TABLE apps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(100) NOT NULL,
    route VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- UserApps relation table - N:N relationship between users and apps
CREATE TABLE user_apps (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    app_id INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, app_id)
);

-- Solicitacoes table - stores emergency requests
CREATE TABLE solicitacoes (
    id SERIAL PRIMARY KEY,
    atendente_id INTEGER REFERENCES users(id),
    nome_solicitante VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    pa VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pendente',
    link_token VARCHAR(100) UNIQUE,
    link_expiracao TIMESTAMPTZ,
    coordenadas JSONB,
    endereco VARCHAR(500),
    plus_code VARCHAR(20),
    archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    sms_status VARCHAR(20),
    sms_error_code VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Mensagens table - stores chat messages between operators and requesters
CREATE TABLE mensagens (
    id SERIAL PRIMARY KEY,
    solicitacao_id INTEGER NOT NULL REFERENCES solicitacoes(id) ON DELETE CASCADE,
    remetente VARCHAR(50) NOT NULL,
    conteudo TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'text',
    media_url VARCHAR(500),
    lida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Midias table - stores uploaded media files
CREATE TABLE midias (
    id SERIAL PRIMARY KEY,
    solicitacao_id INTEGER NOT NULL REFERENCES solicitacoes(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    url VARCHAR(500) NOT NULL,
    nome VARCHAR(255),
    tamanho INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table - stores all actions for auditing
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id INTEGER,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Short URLs table - for link shortening to avoid SMS blocking
CREATE TABLE short_urls (
    id SERIAL PRIMARY KEY,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    original_token VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ====================== ÍNDICES ======================
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_pa ON users(pa);

CREATE INDEX idx_solicitacoes_status ON solicitacoes(status);
CREATE INDEX idx_solicitacoes_atendente_id ON solicitacoes(atendente_id);
CREATE INDEX idx_solicitacoes_created_at ON solicitacoes(created_at DESC);

CREATE INDEX idx_mensagens_solicitacao_id ON mensagens(solicitacao_id);
CREATE INDEX idx_mensagens_created_at ON mensagens(created_at DESC);

CREATE INDEX idx_short_urls_short_code ON short_urls(short_code);

-- ====================== SEED DATA ======================

-- Usuários administrativos com senhas bcrypt
-- Hashes gerados para as senhas especificadas
INSERT INTO users (username, password, name, role, pa, active, allowed_apps) VALUES
-- admin (senha: admincobom)
(
    'admin',
    '$2a$10$8wTDh8HMerNaeH8ecS62RuUMgsWF788kzSwFBtC4gMQ/Zvqo/qtSC',
    'Administrador Sistema',
    'ADMINISTRADOR',
    'PA-01',
    TRUE,
    '["geoloc193", "viaturas", "contingencia", "chat", "headsets", "info-cobom", "agenda", "gestao-dejem", "mapa-offline", "auditoria"]'::jsonb
),
-- supervisor (senha: supervisorcobom)
(
    'supervisor',
    '$2a$10$vL8zdb/P/Zg1KwezRNVK1.ZClnCC08YLZ8Un3DMrMuUbvWyUhHfPq',
    'Carlos Supervisor',
    'SUPERVISOR',
    'PA-01',
    TRUE,
    '["geoloc193", "viaturas", "contingencia", "auditoria"]'::jsonb
),
-- supcontrole (senha: supervisorcobom)
(
    'supcontrole',
    '$2a$10$vL8zdb/P/Zg1KwezRNVK1.ZClnCC08YLZ8Un3DMrMuUbvWyUhHfPq',
    'Supervisor Controle',
    'SUPERVISOR',
    'PA-02',
    TRUE,
    '["geoloc193", "viaturas", "contingencia", "auditoria"]'::jsonb
),
-- supatendimento (senha: supervisorcobom)
(
    'supatendimento',
    '$2a$10$vL8zdb/P/Zg1KwezRNVK1.ZClnCC08YLZ8Un3DMrMuUbvWyUhHfPq',
    'Supervisor Atendimento',
    'SUPERVISOR',
    'PA-03',
    TRUE,
    '["geoloc193", "viaturas", "contingencia", "auditoria"]'::jsonb
),
-- atendente (senha: atendente193cobom)
(
    'atendente',
    '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi',
    'João Atendente',
    'ATENDENTE',
    'PA-01',
    TRUE,
    '["geoloc193", "chat"]'::jsonb
),
-- inclusor09 (senha: inclusorcobom)
(
    'inclusor09',
    '$2a$10$eNL9Mv1dBjWXuJENgQB36e.MbI088Ejym15n9R2ik/G9KIU6S.q5y',
    'Inclusor 09',
    'INCLUSOR',
    'PA-09',
    TRUE,
    '["geoloc193", "contingencia"]'::jsonb
),
-- inclusor10 (senha: inclusorcobom)
(
    'inclusor10',
    '$2a$10$eNL9Mv1dBjWXuJENgQB36e.MbI088Ejym15n9R2ik/G9KIU6S.q5y',
    'Inclusor 10',
    'INCLUSOR',
    'PA-10',
    TRUE,
    '["geoloc193", "contingencia"]'::jsonb
)
ON CONFLICT (username) DO NOTHING;

-- Usuários dos Postos de Atendimento PA-101 a PA-119 (senha: atendente193cobom)
INSERT INTO users (username, password, name, role, pa, active, allowed_apps) VALUES
-- PA-101 a PA-110
('PA-101', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-101', 'ATENDENTE', '1101', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb),
('PA-102', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-102', 'ATENDENTE', '1102', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb),
('PA-103', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-103', 'ATENDENTE', '1103', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb),
('PA-104', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-104', 'ATENDENTE', '1104', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb),
('PA-105', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-105', 'ATENDENTE', '1105', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb),
('PA-106', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-106', 'ATENDENTE', '1106', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb),
('PA-107', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-107', 'ATENDENTE', '1107', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb),
('PA-108', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-108', 'ATENDENTE', '1108', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb),
('PA-109', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-109', 'ATENDENTE', '1109', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb),
('PA-110', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-110', 'ATENDENTE', '1110', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb),
-- PA-111 a PA-119
('PA-111', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-111', 'ATENDENTE', '1111', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb),
('PA-112', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-112', 'ATENDENTE', '1112', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb),
('PA-113', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-113', 'ATENDENTE', '1113', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb),
('PA-114', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-114', 'ATENDENTE', '1114', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb),
('PA-115', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-115', 'ATENDENTE', '1115', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb),
('PA-116', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-116', 'ATENDENTE', '1116', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb),
('PA-117', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-117', 'ATENDENTE', '1117', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb),
('PA-118', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-118', 'ATENDENTE', '1118', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb),
('PA-119', '$2a$10$VYN2pa04JiK/acFelwtfSuLdrRzwgsnBjr5Ypjecg3Wp65OrrxWfi', 'Atendente PA-119', 'ATENDENTE', '1119', TRUE, '["geoloc193", "contingencia", "chat", "agenda", "mapa-offline"]'::jsonb)
ON CONFLICT (username) DO NOTHING;

-- Apps disponíveis no sistema
INSERT INTO apps (name, slug, icon, route, description, active) VALUES
('Geoloc 193', 'geoloc193', 'MapPin', '/geoloc193', 'Sistema de geolocalização para emergências', TRUE),
('Gestão de Viaturas', 'viaturas', 'Truck', '/viaturas', 'Controle de frota de viaturas', TRUE),
('Contingência', 'contingencia', 'AlertTriangle', '/contingencia', 'Plano de contingência', TRUE),
('Chat Integrado', 'chat', 'MessageSquare', '/chat', 'Sistema de chat interno', TRUE),
('Headsets', 'headsets', 'Headphones', '/headsets', 'Controle de headsets', TRUE),
('Info COBOM', 'info-cobom', 'Info', '/info-cobom', 'Informações do COBOM', TRUE),
('Agenda', 'agenda', 'Calendar', '/agenda', 'Agenda de escalas', TRUE),
('Gestão Dejem', 'gestao-dejem', 'Users', '/gestao-dejem', 'Gestão de equipes Dejem', TRUE),
('Mapa Offline', 'mapa-offline', 'Map', '/mapa-offline', 'Mapas offline para campo', TRUE),
('Auditoria', 'auditoria', 'FileText', '/auditoria', 'Sistema de auditoria', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Associar apps aos usuários (além do campo allowed_apps)
INSERT INTO user_apps (user_id, app_id)
SELECT u.id, a.id
FROM users u
CROSS JOIN apps a
WHERE (u.username = 'admin')
   OR (u.username = 'supervisor' AND a.slug IN ('geoloc193', 'viaturas', 'contingencia', 'auditoria'))
   OR (u.username = 'atendente' AND a.slug IN ('geoloc193', 'chat'))
   OR (u.username LIKE 'PA-%' AND a.slug IN ('geoloc193', 'contingencia', 'chat', 'agenda', 'mapa-offline'))
ON CONFLICT (user_id, app_id) DO NOTHING;

-- Inserir algumas solicitações de exemplo
INSERT INTO solicitacoes (atendente_id, nome_solicitante, telefone, status, endereco) 
SELECT 
    (SELECT id FROM users WHERE username = 'atendente'),
    'Maria Silva',
    '+5511999999999',
    'pendente',
    'Rua das Flores, 123 - Centro'
WHERE EXISTS (SELECT 1 FROM users WHERE username = 'atendente')
ON CONFLICT DO NOTHING;

-- ====================== CONCEDER PERMISSÕES FINAIS ======================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO geoloc_user_postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO geoloc_user_postgres;

-- ====================== VERIFICAÇÃO ======================
SELECT '✅ Banco geoloc_bombeiros inicializado!' as mensagem;
SELECT 'Total de usuários: ' || COUNT(*) as total_usuarios FROM users;
SELECT 'Total de apps: ' || COUNT(*) as total_apps FROM apps;
SELECT 'Usuários por papel:' as info;
SELECT role, COUNT(*) as quantidade FROM users GROUP BY role ORDER BY role;
SELECT 'Usuários PA (101-119):' as info;
SELECT username, pa FROM users WHERE username LIKE 'PA-1%' ORDER BY username;