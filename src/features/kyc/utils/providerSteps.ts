/**
 * Step checklist of "Convertirte en prestador" (pure): 1 Identidad (KYC),
 * 2 Teléfono, 3 Tu servicio. Exactly one step is `active` (the current one)
 * until everything is done; the CTA belongs to that step.
 */
import type { KYCStatus } from '../types/kyc.types';
import { getKycCopy, type KycAttempts } from './kycCopy';
import { VERIFY_PHONE_ROUTE, type ProviderReadiness } from './providerReadiness';

export type ProviderStepId = 'kyc' | 'phone' | 'service';
export type ProviderStepStatus = 'done' | 'active' | 'pending';

export interface ProviderStep {
  id: ProviderStepId;
  label: string;
  status: ProviderStepStatus;
  description: string;
  cta: { label: string; route: string } | null;
}

export const KYC_ROUTE = '/(tabs)/profile/kyc';
export const SERVICE_FORM_ROUTE = '/service-form';

function kycCta(kycStatus: KYCStatus, attempts?: KycAttempts | null): ProviderStep['cta'] {
  if (kycStatus === 'not_started') return { label: 'Iniciar verificación', route: KYC_ROUTE };
  if (kycStatus === 'in_progress' || kycStatus === 'pending') return { label: 'Ver estado', route: KYC_ROUTE };
  const copy = getKycCopy(kycStatus, attempts);
  // Exhausted attempts: the status screen offers the support contact.
  return { label: copy.retryLabel ?? 'Ver estado', route: KYC_ROUTE };
}

export function buildProviderSteps(
  readiness: Pick<ProviderReadiness, 'kycApproved' | 'phoneVerified' | 'canPublish' | 'nextStep'>,
  kycStatus: KYCStatus,
  attempts?: KycAttempts | null,
): ProviderStep[] {
  const { kycApproved, phoneVerified, canPublish, nextStep } = readiness;

  const kycDescription =
    kycStatus === 'not_started'
      ? 'Sube tu documento y una selfie para confirmar quién eres.'
      : getKycCopy(kycStatus, attempts).description;

  return [
    {
      id: 'kyc',
      label: 'Identidad',
      status: kycApproved ? 'done' : 'active',
      description: kycDescription,
      cta: kycApproved ? null : kycCta(kycStatus, attempts),
    },
    {
      id: 'phone',
      label: 'Teléfono',
      status: phoneVerified ? 'done' : nextStep === 'phone' ? 'active' : 'pending',
      description: phoneVerified
        ? 'Tu teléfono está verificado.'
        : 'Verifica tu número con un código por SMS. Es obligatorio para publicar.',
      cta: nextStep === 'phone' ? { label: 'Verificar teléfono', route: VERIFY_PHONE_ROUTE } : null,
    },
    {
      id: 'service',
      label: 'Tu servicio',
      status: canPublish ? 'active' : 'pending',
      description: canPublish
        ? 'Todo listo. Crea tu servicio y empieza a recibir clientes.'
        : 'Cuando completes la identidad y el teléfono podrás publicar tu servicio.',
      cta: canPublish ? { label: 'Crear servicio', route: SERVICE_FORM_ROUTE } : null,
    },
  ];
}

/** The step whose CTA the screen highlights, or undefined when none is actionable. */
export function currentStep(steps: ProviderStep[]): ProviderStep | undefined {
  return steps.find((s) => s.status === 'active');
}

