import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
} from '@react-email/components';

interface EmailTemplateNewDeviceProps {
  firstName: string;
  device: string;
  location: string;
  ipAddress: string;
  when: string;
  // Where the CTA button points — the user's own /dashboard, or an admin's
  // /dashboard/admin/users/[id]. Omit to drop the button.
  manageUrl?: string;
  // Set on the copy sent to admins: switches to the "one of your users"
  // framing and names the account.
  account?: string;
}

export function EmailTemplateNewDevice({
  firstName,
  device,
  location,
  ipAddress,
  when,
  manageUrl,
  account,
}: EmailTemplateNewDeviceProps) {
  const forAdmin = Boolean(account);

  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ margin: '0 auto', padding: '20px 0 48px', maxWidth: '560px' }}>
          <Section style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '40px' }}>
            <Heading style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px', color: '#1a1a1a', textAlign: 'center' as const }}>
              {forAdmin ? 'A user signed in from a new device' : 'New sign-in from an unrecognized device'}
            </Heading>
            <Text style={{ fontSize: '16px', color: '#666666', marginBottom: '24px', lineHeight: '24px' }}>
              {forAdmin
                ? `${account}'s account was just used to sign in from a device it hasn't been seen on before.`
                : `Hi ${firstName}, your account was just used to sign in from a device we haven't seen before.`}
            </Text>
            <Section style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
              {forAdmin && (
                <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '20px' }}><strong>Account:</strong> {account}</Text>
              )}
              <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '20px' }}><strong>Device:</strong> {device}</Text>
              <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '20px' }}><strong>Approx. location:</strong> {location}</Text>
              <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '20px' }}><strong>IP address:</strong> {ipAddress}</Text>
              <Text style={{ fontSize: '14px', color: '#1a1a1a', margin: '0', lineHeight: '20px' }}><strong>When:</strong> {when}</Text>
            </Section>
            {manageUrl && (
              <Section style={{ textAlign: 'center' as const, marginBottom: '24px' }}>
                <Button
                  href={manageUrl}
                  style={{ backgroundColor: '#1a1a1a', color: '#ffffff', fontSize: '14px', fontWeight: 'bold', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none' }}
                >
                  {forAdmin ? 'Review this account' : 'Review your sessions'}
                </Button>
              </Section>
            )}
            <Text style={{ fontSize: '14px', color: '#666666', lineHeight: '22px' }}>
              {forAdmin
                ? "If the account owner didn't do this, revoke their sessions from the link above and have them reset their password."
                : "If this was you, no action is needed. If you don't recognize it, change your password now and revoke any sessions you don't recognize."}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
