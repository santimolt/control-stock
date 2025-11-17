import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const loginSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);

      const username = data.username.toLowerCase().trim();

      console.log(username);

      // 1. Verificar usuario y que esté activo
      const { data: profiles, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, username, active")
        .eq("username", username);

      console.log(profiles);
      if (profileError || !profiles || profiles.length === 0) {
        throw new Error("Usuario o contraseña incorrectos");
      }

      const profile = profiles[0];
      if (!profile.active) {
        throw new Error("Tu cuenta ha sido desactivada. Contacta a un administrador.");
      }

      // 2. Email basado en el username
      const email = `${username}@example.com`;

      // 3. Iniciar sesión
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password: data.password,
        });

      if (authError || !authData.user) {
        throw new Error("Usuario o contraseña incorrectos");
      }

      console.log(authData);

      setUser(authData.user);

      toast({
        title: "Bienvenido",
        description: "Has iniciado sesión correctamente",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al iniciar sesión",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl sm:text-2xl">Iniciar Sesión</CardTitle>
        <CardDescription className="text-sm">
          Ingresa tus credenciales para acceder a tu cuenta
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm">Usuario</Label>
            <Input
              id="username"
              type="text"
              placeholder="tu_usuario"
              className="h-10 sm:h-11"
              {...register("username")}
            />
            {errors.username && (
              <p className="text-xs sm:text-sm text-destructive">
                {errors.username.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-10 sm:h-11"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs sm:text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button type="submit" className="w-full h-10 sm:h-11" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
