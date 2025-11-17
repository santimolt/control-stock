import { useState, useEffect } from "react";
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

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "El usuario debe tener al menos 3 caracteres")
      .max(20, "El usuario no puede tener más de 20 caracteres")
      .regex(
        /^[a-z0-9_]+$/,
        "El usuario solo puede contener letras minúsculas, números y guiones bajos"
      ),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, isAdmin } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login", { replace: true });
      } else if (!isAdmin()) {
        navigate("/", { replace: true });
      }
    }
  }, [user, authLoading, isAdmin, navigate]);

  const onSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true);

      // Verificar existencia (sin explotar si no existe)
      const { data: existingUser } = await supabase
        .from("user_profiles")
        .select("username")
        .eq("username", data.username.toLowerCase().trim());

      if (existingUser && existingUser.length > 0) {
        throw new Error("Este usuario ya está en uso");
      }

      // Llamar a la función Edge para crear el usuario usando Admin API
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error("No hay sesión activa");
      }

      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'create-user',
        {
          body: {
            username: data.username.toLowerCase().trim(),
            password: data.password,
          },
        }
      );

      if (functionError) throw functionError;

      if (!functionData?.success) {
        throw new Error(functionData?.error || "Error al crear el usuario");
      }

      toast({
        title: "Usuario creado",
        description: `El usuario ${data.username} ha sido creado correctamente`,
      });
      navigate("/users/register");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear la cuenta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nuevo Usuario</CardTitle>
        <CardDescription>
          Crea una nueva cuenta de usuario para gestionar stock
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              type="text"
              placeholder="tu_usuario"
              {...register("username")}
            />
            {errors.username && (
              <p className="text-sm text-destructive">
                {errors.username.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Solo letras minúsculas, números y guiones bajos (3-20 caracteres)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando usuario..." : "Crear Usuario"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
