import { useState, type FC, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { NidoLogo } from '@/components/ui/NidoLogo';

export const Login: FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!email.trim() || !password.trim()) {
        setError('Por favor ingresá tu correo y contraseña.');
        return;
        }
        setError(null);
        navigate('/dashboard');
    };

    return (
        <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-nido-bg text-nido-ink">
        {/* Fondo cálido difuminado */}
        <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-35"
            style={{
            backgroundImage:
                "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80')",
            }}
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-nido-bg/80 via-nido-bg/65 to-nido-card-alt/85" />

        {/* Header superior */}
        <header className="relative z-10 flex w-full items-center justify-between px-6 py-5 sm:px-10">
            <NidoLogo size="sm" />
            <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 text-xs text-nido-secondary transition-colors hover:text-nido-ink"
            >
            <span className="h-1.5 w-1.5 rounded-full bg-nido-olive" />
            <span>¿Necesitas ayuda?</span>
            </button>
        </header>

        {/* Tarjeta central de Login */}
        <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
            <div className="w-full max-w-102.5 rounded-3xl border border-nido-border bg-nido-surface/95 px-8 py-10 shadow-[0_20px_50px_rgba(30,34,29,0.06)] backdrop-blur-md">
            <div className="mb-7 text-center">
                <div className="mb-4 flex justify-center">
                <NidoLogo />
                </div>
                <h1 className="text-[22px] font-bold tracking-tight text-nido-ink">
                Bienvenido de nuevo
                </h1>
                <p className="mt-1 text-xs text-nido-muted">
                Inicia sesión para gestionar tu inventario
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                <div className="flex items-center gap-2 rounded-xl border border-nido-terracotta-border bg-nido-terracotta-bg p-3 text-xs text-nido-terracotta-text">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
                )}

                <div>
                <label
                    htmlFor="login-email"
                    className="mb-1.5 block text-xs font-medium text-nido-ink"
                >
                    Correo electrónico
                </label>
                <div className="relative">
                    <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-nido-subtle" />
                    <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    className="w-full rounded-xl border border-nido-border-strong bg-nido-surface py-2.5 pr-4 pl-10 text-xs text-nido-ink placeholder:text-nido-subtle transition-all focus:border-nido-olive focus:ring-2 focus:ring-nido-olive/10 focus:outline-none"
                    />
                </div>
                </div>

                <div>
                <label
                    htmlFor="login-password"
                    className="mb-1.5 block text-xs font-medium text-nido-ink"
                >
                    Contraseña
                </label>
                <div className="relative">
                    <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-nido-subtle" />
                    <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full rounded-xl border border-nido-border-strong bg-nido-surface py-2.5 pr-10 pl-10 text-xs text-nido-ink placeholder:text-nido-subtle transition-all focus:border-nido-olive focus:ring-2 focus:ring-nido-olive/10 focus:outline-none"
                    />
                    <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label="Mostrar u ocultar contraseña"
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-nido-subtle hover:text-nido-ink"
                    >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] text-nido-secondary select-none">
                    <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-nido-border-strong accent-nido-olive"
                    />
                    <span>Recordarme</span>
                </label>
                <button
                    type="button"
                    className="cursor-pointer text-[11px] font-semibold text-nido-ink hover:underline"
                >
                    ¿Olvidaste tu contraseña?
                </button>
                </div>

                <button
                type="submit"
                className="mt-2 w-full cursor-pointer rounded-xl bg-nido-olive py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-nido-olive-hover"
                >
                Iniciar sesión
                </button>

                <p className="pt-4 text-center text-[11px] text-nido-muted">
                ¿Nuevo en NIDO?{' '}
                <Link to="/register" className="font-bold text-nido-ink hover:underline">
                    Crear una cuenta
                </Link>
                </p>
            </form>
            </div>
        </main>

        <div className="h-6" />
        </div>
    );
};