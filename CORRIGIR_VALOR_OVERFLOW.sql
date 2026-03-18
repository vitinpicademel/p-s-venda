-- ============================================
-- CORREÇÃO: Aumentar capacidade do campo property_value
-- Para suportar valores na casa dos bilhões (ex: R$ 90.909.090.909,90)
-- ============================================

-- Alterar DECIMAL(12,2) para NUMERIC(15,2)
-- Isso permite valores até 999.999.999.999.999,99 (quase 1 quatrilhão)
ALTER TABLE processes 
ALTER COLUMN property_value TYPE NUMERIC(15,2);

-- Verificar se a alteração foi aplicada
SELECT 
  column_name,
  data_type,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_name = 'processes' 
  AND column_name = 'property_value';
