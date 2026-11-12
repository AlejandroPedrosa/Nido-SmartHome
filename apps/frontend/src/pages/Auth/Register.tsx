import { useState, type FC, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { NidoLogo } from '@/components/ui/NidoLogo';

/** Correo de ejemplo para mostrar el estado "correo ya registrado" (HTTP 409). */
const REGISTERED_EMAIL = 'usuario@ejemplo.com';

const inputClasses =
    'w-full rounded-xl border border-nido-border-strong bg-nido-surface py-2.5 pr-10 pl-10 text-xs text-nido-ink placeholder:text-nido-subtle transition-all focus:border-nido-olive focus:ring-2 focus:ring-nido-olive/10 focus:outline-none';

export const Register: FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            setError('Completá todos los campos obligatorios.');
            return;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (email.trim().toLowerCase() === REGISTERED_EMAIL) {
            setError('Ese correo ya está registrado (HTTP 409). Probá iniciando sesión.');
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

            <header className="relative z-10 flex w-full items-center justify-between px-6 py-5 sm:px-10">
                <NidoLogo size="sm" />
            </header>

            <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
                <div className="w-full max-w-102.5 rounded-3xl border border-nido-border bg-nido-surface/95 px-8 py-10 shadow-[0_20px_50px_rgba(30,34,29,0.06)] backdrop-blur-md">
                    <div className="mb-7 text-center">
                        <div className="mb-4 flex justify-center">
                            <NidoLogo />
                        </div>
                        <h1 className="text-[22px] font-bold tracking-tight text-nido-ink">Creá tu hogar en NIDO</h1>
                        <p className="mt-1 text-xs text-nido-muted">
                            Precargamos tus espacios iniciales automáticamente
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div
                                role="alert"
                                className="flex items-center gap-2 rounded-xl border border-nido-terracotta-border bg-nido-terracotta-bg p-3 text-xs text-nido-terracotta-text"
                            >
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="register-email" className="mb-1.5 block text-xs font-medium text-nido-ink">
                                Correo electrónico
                            </label>
                            <div className="relative">
                                <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-nido-subtle" />
                                <input
                                    id="register-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    className={inputClasses}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="register-password" className="mb-1.5 block text-xs font-medium text-nido-ink">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-nido-subtle" />
                                <input
                                    id="register-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    className={inputClasses}
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

                        <div>
                            <label
                                htmlFor="register-confirm-password"
                                className="mb-1.5 block text-xs font-medium text-nido-ink"
                            >
                                Confirmar contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-nido-subtle" />
                                <input
                                    id="register-confirm-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repetí tu contraseña"
                                    className={inputClasses}
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-2 rounded-xl border border-nido-border bg-nido-card-alt p-3 text-[11px] text-nido-secondary">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-nido-sage-text" />
                            <span>
                                Al registrarte se crearán por defecto:{' '}
                                <strong className="text-nido-ink">
                                    Cocina, Heladera, Freezer, Alacena, Baño y Lavadero
                                </strong>
                                .
                            </span>
                        </div>

                        <button
                            type="submit"
                            className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-nido-olive py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-nido-olive-hover"
                        >
                            <span>Crear cuenta</span>
                            <ArrowRight className="h-4 w-4" />
                        </button>

                        <p className="pt-4 text-center text-[11px] text-nido-muted">
                            ¿Ya tenés cuenta?{' '}
                            <Link to="/login" className="font-bold text-nido-ink hover:underline">
                                Iniciá sesión
                            </Link>
                        </p>
                    </form>
                </div>
            </main>

            <div className="h-6" />
        </div>
    );
};
