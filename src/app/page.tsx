import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabaseConfigurado =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let estadoConexion = "Sin configurar (.env.local vacío)";

  if (supabaseConfigurado) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.getSession();
      estadoConexion = error
        ? `Error de conexión: ${error.message}`
        : "Conectado a Supabase";
    } catch (err) {
      estadoConexion = `Error de conexión: ${(err as Error).message}`;
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Plataforma GTAP
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Estado de Supabase: {estadoConexion}
        </p>
      </main>
    </div>
  );
}
