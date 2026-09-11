"use client";
import { useActionState, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Check, ArrowRight, Copy, Share2, LoaderCircle } from "lucide-react";
import {
  loginAction,
  verifyOtpAction,
  claimAction,
  type ActionState,
} from "@/lib/actions";
export function Submit({
  children,
  pendingText = "Guardando…",
  name,
  value,
  secondary = false,
}: {
  children: ReactNode;
  pendingText?: string;
  name?: string;
  value?: string;
  secondary?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      name={name}
      value={value}
      disabled={pending}
      className={"button " + (secondary ? "button-secondary" : "")}
    >
      {pending ? (
        <>
          <LoaderCircle className="spin" size={16} />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
export function ActionForm({
  action,
  children,
  className = "form-stack",
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className={className}>
      {children}
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="form-success">
          {state.success}
        </p>
      )}
    </form>
  );
}
export function LoginForm({ next }: { next: string }) {
  const [sent, send] = useActionState(loginAction, {});
  const [verified, verify] = useActionState(verifyOtpAction, {});
  return sent.sent ? (
    <form action={verify} className="form-stack">
      <p>
        Enviamos un acceso a <strong>{sent.email}</strong>. Abre el enlace o
        ingresa el código del correo.
      </p>
      <input type="hidden" name="email" value={sent.email} />
      <input type="hidden" name="next" value={next} />
      <label>
        Código de acceso
        <input
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6,8}"
          required
          placeholder="000000"
        />
      </label>
      {verified.error && (
        <p className="form-error" role="alert">
          {verified.error}
        </p>
      )}
      <Submit>
        Confirmar código <ArrowRight size={17} />
      </Submit>
    </form>
  ) : (
    <form action={send} className="form-stack">
      <input type="hidden" name="next" value={next} />
      <label>
        Tu email
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="hola@ejemplo.com"
          required
        />
      </label>
      {sent.error && (
        <p className="form-error" role="alert">
          {sent.error}
        </p>
      )}
      <Submit pendingText="Enviando…">
        Continuar <ArrowRight size={17} />
      </Submit>
      <p className="fineprint">
        Te enviaremos un enlace para entrar. Sin contraseñas.
      </p>
    </form>
  );
}
export function ClaimForm({
  code,
  slug,
  type,
  owned,
}: {
  code?: string;
  slug: string;
  type: "QR" | "SECRET_WORD";
  owned: boolean;
}) {
  const [state, action] = useActionState(claimAction, {});
  if (state.success)
    return (
      <div className="claim-success" role="status">
        <div className="success-check">
          <Check size={30} />
        </div>
        <h2>Ya es tuyo.</h2>
        <p>Estuviste ahí.</p>
        <Link className="button" href={"/collectibles/" + slug}>
          Ver mi recuerdo <ArrowRight size={17} />
        </Link>
        <Link className="text-link" href="/collection">
          Ver en mi colección
        </Link>
      </div>
    );
  if (owned)
    return (
      <div className="claim-success">
        <p className="form-success">
          <Check size={18} /> Ya tienes este asado en tu colección.
        </p>
        <Link className="button" href="/collection">
          Ver en mi colección
        </Link>
      </div>
    );
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="code" value={code ?? ""} />
      {type === "SECRET_WORD" && (
        <label>
          ¿Cuál es la palabra del asado?
          <input
            name="word"
            maxLength={200}
            required
            autoComplete="off"
            placeholder="La palabra que compartió el organizador"
          />
        </label>
      )}
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      <Submit pendingText="Coleccionando…">
        Coleccionar <ArrowRight size={17} />
      </Submit>
    </form>
  );
}
export function CopyButton({
  value,
  label = "Copiar link",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  return (
    <>
      <button
        type="button"
        className="button button-secondary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            setError(true);
          }
        }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
        {copied ? "Copiado" : label}
      </button>
      {error && (
        <input
          aria-label="Enlace para copiar"
          readOnly
          value={value}
          onFocus={(e) => e.target.select()}
        />
      )}
    </>
  );
}
export function ShareButton({ title }: { title: string }) {
  const [feedback, setFeedback] = useState("");
  return (
    <>
      <button
        className="button button-secondary"
        onClick={async () => {
          try {
            if (navigator.share)
              await navigator.share({ title, url: location.href });
            else {
              await navigator.clipboard.writeText(location.href);
              setFeedback("Enlace copiado.");
            }
          } catch {
            setFeedback(
              "Puedes copiar el enlace desde la barra de direcciones.",
            );
          }
        }}
      >
        <Share2 size={17} /> Compartir recuerdo
      </button>
      <span role="status" className="fineprint">
        {feedback}
      </span>
    </>
  );
}
