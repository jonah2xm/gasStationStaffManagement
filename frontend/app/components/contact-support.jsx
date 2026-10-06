import { Clock, Headset, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { contactRenseigne } from "@/lib/contact";

function ContactLine({ icon: Icon, children }) {
  return (
    <li className="flex min-w-0 items-center gap-2">
      <Icon aria-hidden className="h-3.5 w-3.5 shrink-0 text-ink-600" />
      <span className="min-w-0 truncate">{children}</span>
    </li>
  );
}

/**
 * Bloc « Mot de passe oublié ? » : coordonnées de l'assistance si elles sont
 * renseignées, sinon simple renvoi vers l'administrateur.
 */
export function ContactSupport({ contact, className }) {
  if (!contactRenseigne(contact)) {
    return (
      <p className={cn("text-[13px] text-muted-foreground", className)}>
        Mot de passe oublié ? Contactez votre administrateur.
      </p>
    );
  }

  const qui = [contact.nom, contact.service].filter(Boolean).join(" · ");
  const tel = contact.telephone.replace(/[^\d+]/g, "");

  return (
    <div className={cn("rounded-lg border border-border bg-background px-4 py-3", className)}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <Headset aria-hidden className="h-4 w-4 text-ink-700" />
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div>
            <p className="text-[13px] font-medium text-foreground">Mot de passe oublié ?</p>
            <p className="text-xs text-muted-foreground">{qui ? `Contactez ${qui}.` : "Contactez l'assistance."}</p>
          </div>
          <ul className="space-y-1 text-[13px] text-foreground">
            {contact.telephone && (
              <ContactLine icon={Phone}>
                <a href={`tel:${tel}`} className="tabular-nums underline-offset-4 hover:underline">
                  {contact.telephone}
                </a>
              </ContactLine>
            )}
            {contact.email && (
              <ContactLine icon={Mail}>
                <a href={`mailto:${contact.email}`} className="underline-offset-4 hover:underline">
                  {contact.email}
                </a>
              </ContactLine>
            )}
            {contact.horaires && (
              <ContactLine icon={Clock}>
                <span className="text-muted-foreground">{contact.horaires}</span>
              </ContactLine>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
