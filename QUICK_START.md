# 🚀 Quick Start - Configuração Rápida

## ⚡ Resumo dos 6 Passos

### 1️⃣ Obter Credenciais (2 minutos)
- Supabase Dashboard → Settings → API
- Copie **Project URL** e **anon public key**
- Cole no arquivo `.env.local`

### 2️⃣ Executar SQL Schema (1 minuto)
- Supabase Dashboard → SQL Editor
- Cole o conteúdo de `supabase-schema-v2.sql`
- Clique em **Run**

### 3️⃣ Criar Bucket Storage (1 minuto)
- Supabase Dashboard → Storage → New bucket
- Nome: `contracts` | Privado: ✅
- Depois execute `supabase-storage-policies.sql` no SQL Editor

### 4️⃣ Criar Admin (2 minutos)
- Authentication → Users → Add user
- Email: `admin@donna.com` | Senha: (defina)
- Auto Confirm: ✅
- Depois execute no SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@donna.com';
```

### 5️⃣ Reiniciar Servidor (10 segundos)
```bash
# Ctrl+C para parar
npm run dev
```

### 6️⃣ Testar
- Acesse http://localhost:3000
- Login: `admin@donna.com` + sua senha
- Deve entrar em `/admin`

---

## 📋 Arquivos Importantes

- `.env.local` - Variáveis de ambiente (você precisa preencher)
- `supabase-schema-v2.sql` - Schema do banco (execute no Supabase)
- `supabase-storage-policies.sql` - Políticas do Storage (execute após criar bucket)
- `CONFIGURAR_SUPABASE.md` - Guia detalhado completo

---

## ✅ Checklist Rápido

- [ ] `.env.local` com valores reais
- [ ] SQL schema executado
- [ ] Bucket `contracts` criado
- [ ] Políticas do Storage configuradas
- [ ] Admin criado e role atualizado
- [ ] Servidor reiniciado
- [ ] Login funcionando

---

**Dúvidas?** Veja o arquivo `CONFIGURAR_SUPABASE.md` para instruções detalhadas.

