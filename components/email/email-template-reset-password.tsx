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

interface EmailTemplateResetPasswordProps {
  firstName: string;
  url: string;
}

export function EmailTemplateResetPassword({ firstName, url }: EmailTemplateResetPasswordProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ margin: '0 auto', padding: '20px 0 48px', maxWidth: '560px' }}>
          <Section style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '40px', textAlign: 'center' as const }}>
            <Heading style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '12px', color: '#1a1a1a' }}>
              Reset your password
            </Heading>
            <Text style={{ fontSize: '16px', color: '#666666', marginBottom: '32px', lineHeight: '24px' }}>
              Hi {firstName}, we got a request to reset your password. This link expires in an hour
              — if you didn&apos;t ask for this, you can safely ignore this email.
            </Text>
            <Section style={{ marginBottom: '32px' }}>
              <Button
                href={url}
                style={{
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  padding: '12px 32px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                Reset password
              </Button>
            </Section>
            <Text style={{ fontSize: '13px', color: '#999999', lineHeight: '20px', wordBreak: 'break-all' as const }}>
              Or paste this link into your browser:<br />
              <a href={url} style={{ color: '#000000', textDecoration: 'underline' }}>{url}</a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
