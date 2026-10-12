# Seguridad y privacidad

- Cada consulta y mutación financiera debe limitarse al usuario autenticado y quedar protegida por RLS en PostgreSQL.
- Los datos recibidos se validan en servidor con esquemas Zod; la validación del navegador es solo una ayuda de UX.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` es pública y solo es segura con políticas RLS correctas.
- `SUPABASE_SERVICE_ROLE_KEY` omite RLS: nunca importarla desde componentes cliente, serializarla ni registrarla en logs.
- No almacenar contraseñas ni enviar datos financieros a servicios externos innecesarios.
- No registrar montos, descripciones ni otros datos financieros sensibles en logs.
- `.env*` está excluido de Git, salvo `.env.example`, que contiene nombres sin valores.

Antes de habilitar usuarios reales, implementar y probar políticas RLS, ownership en servidor, autenticación, recuperación de cuenta y eliminación/exportación de datos según el roadmap.
