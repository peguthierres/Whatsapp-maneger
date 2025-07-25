-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE direction_type AS ENUM ('incoming', 'outgoing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_status_type AS ENUM ('sent', 'delivered', 'read', 'failed', 'processing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE node_type_enum AS ENUM ('message', 'condition', 'webhook', 'delay');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Session storage table (required for Replit Auth)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

-- Users table (with password authentication)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    password_hash VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chatbot flows
CREATE TABLE IF NOT EXISTS flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT false,
    trigger_keywords TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Flow nodes (individual steps in a flow)
CREATE TABLE IF NOT EXISTS flow_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    node_type node_type_enum NOT NULL,
    name VARCHAR NOT NULL,
    config JSONB NOT NULL,
    position JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Flow connections (links between nodes)
CREATE TABLE IF NOT EXISTS flow_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES flow_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES flow_nodes(id) ON DELETE CASCADE,
    condition TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Message logs
CREATE TABLE IF NOT EXISTS message_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flow_id UUID REFERENCES flows(id) ON DELETE SET NULL,
    phone_number VARCHAR NOT NULL,
    direction direction_type NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR DEFAULT 'text',
    status message_status_type NOT NULL,
    whatsapp_message_id VARCHAR,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Webhooks configuration
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    url TEXT NOT NULL,
    method VARCHAR DEFAULT 'POST',
    headers JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- WhatsApp Business API configuration
CREATE TABLE IF NOT EXISTS whatsapp_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    app_id VARCHAR NOT NULL,
    phone_number_id VARCHAR NOT NULL,
    access_token TEXT NOT NULL,
    verify_token VARCHAR NOT NULL,
    phone_number VARCHAR,
    business_name VARCHAR,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User sessions for flow execution
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR NOT NULL UNIQUE,
    flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
    current_node_id UUID REFERENCES flow_nodes(id) ON DELETE SET NULL,
    session_data JSONB,
    last_activity TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook execution logs
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    request_payload JSONB,
    response_status INTEGER,
    response_body TEXT,
    response_time INTEGER,
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flows_user_id ON flows(user_id);
CREATE INDEX IF NOT EXISTS idx_flows_is_active ON flows(is_active);
CREATE INDEX IF NOT EXISTS idx_flow_nodes_flow_id ON flow_nodes(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_links_flow_id ON flow_links(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_links_source_node ON flow_links(source_node_id);
CREATE INDEX IF NOT EXISTS idx_flow_links_target_node ON flow_links(target_node_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_user_id ON message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON message_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_logs_phone_number ON message_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_message_logs_direction ON message_logs(direction);
CREATE INDEX IF NOT EXISTS idx_message_logs_status ON message_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_flow_id ON webhooks(flow_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_phone_number ON user_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_flows_updated_at ON flows;
CREATE TRIGGER update_flows_updated_at 
    BEFORE UPDATE ON flows 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_webhooks_updated_at ON webhooks;
CREATE TRIGGER update_webhooks_updated_at 
    BEFORE UPDATE ON webhooks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_config_updated_at ON whatsapp_config;
CREATE TRIGGER update_whatsapp_config_updated_at 
    BEFORE UPDATE ON whatsapp_config 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean old sessions
CREATE OR REPLACE FUNCTION clean_old_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions WHERE expire < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old user sessions (inactive for more than 24 hours)
CREATE OR REPLACE FUNCTION clean_old_user_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions WHERE last_activity < NOW() - INTERVAL '24 hours';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id VARCHAR)
RETURNS TABLE (
    active_flows INTEGER,
    messages_today INTEGER,
    active_users INTEGER,
    success_rate NUMERIC
) AS $$
DECLARE
    today_start TIMESTAMP := DATE_TRUNC('day', NOW());
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM flows WHERE user_id = p_user_id AND is_active = true) as active_flows,
        (SELECT COUNT(*)::INTEGER FROM message_logs WHERE user_id = p_user_id AND created_at >= today_start) as messages_today,
        (SELECT COUNT(DISTINCT phone_number)::INTEGER FROM message_logs WHERE user_id = p_user_id AND created_at >= today_start) as active_users,
        (
            CASE 
                WHEN (SELECT COUNT(*) FROM message_logs WHERE user_id = p_user_id AND direction = 'outgoing') = 0 
                THEN 0.0::NUMERIC
                ELSE 
                    ROUND(
                        (SELECT COUNT(*)::NUMERIC FROM message_logs 
                         WHERE user_id = p_user_id 
                         AND direction = 'outgoing' 
                         AND status IN ('delivered', 'read')) * 100.0 / 
                        (SELECT COUNT(*)::NUMERIC FROM message_logs 
                         WHERE user_id = p_user_id 
                         AND direction = 'outgoing'),
                        1
                    )
            END
        ) as success_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to trigger flow based on keywords
CREATE OR REPLACE FUNCTION find_matching_flow(p_message TEXT, p_user_id VARCHAR DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    flow_id UUID;
    keyword TEXT;
BEGIN
    -- Find flows with matching trigger keywords
    FOR flow_id IN 
        SELECT f.id 
        FROM flows f 
        WHERE f.is_active = true 
        AND (p_user_id IS NULL OR f.user_id = p_user_id)
        AND f.trigger_keywords IS NOT NULL
    LOOP
        -- Check if any keyword matches the message
        FOREACH keyword IN ARRAY (SELECT trigger_keywords FROM flows WHERE id = flow_id)
        LOOP
            IF LOWER(p_message) LIKE '%' || LOWER(keyword) || '%' THEN
                RETURN flow_id;
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Security: Enable Row Level Security (RLS)
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (these would need to be customized based on your auth system)
-- Note: In a real application, you would set up proper RLS policies
-- For now, we'll create basic policies that allow access based on user_id

-- Example RLS policy for flows (customize based on your auth implementation)
DROP POLICY IF EXISTS "Users can manage their own flows" ON flows;
CREATE POLICY "Users can manage their own flows" ON flows
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- Grant permissions (adjust based on your application user)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;

-- Insert sample data for testing (remove in production)
-- INSERT INTO users (id, email, first_name, last_name) VALUES 
-- ('test-user-1', 'test@example.com', 'Test', 'User');

COMMENT ON TABLE flows IS 'Chatbot conversation flows';
COMMENT ON TABLE flow_nodes IS 'Individual nodes/steps in a conversation flow';
COMMENT ON TABLE flow_links IS 'Connections between flow nodes';
COMMENT ON TABLE message_logs IS 'Log of all WhatsApp messages sent and received';
COMMENT ON TABLE webhooks IS 'Webhook configurations for external integrations';
COMMENT ON TABLE whatsapp_config IS 'WhatsApp Business API configuration per user';
COMMENT ON TABLE user_sessions IS 'Active user conversation sessions';
COMMENT ON TABLE webhook_logs IS 'Execution logs for webhook calls';

-- Version info
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_description 
        WHERE objoid = (SELECT oid FROM pg_class WHERE relname = 'flows')
        AND classoid = (SELECT oid FROM pg_class WHERE relname = 'pg_class')
        AND objsubid = 0
    ) THEN
        INSERT INTO pg_catalog.pg_description (objoid, classoid, objsubid, description)
        VALUES (
            (SELECT oid FROM pg_class WHERE relname = 'flows'),
            (SELECT oid FROM pg_class WHERE relname = 'pg_class'),
            0,
            'ChatBot Manager Schema v1.0 - WhatsApp Business Chatbot Management System'
        );
    END IF;
END $$;
