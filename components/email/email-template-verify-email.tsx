import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Link,
  Tailwind,
} from '@react-email/components';

interface EmailTemplateVerifyEmailProps {
  firstName: string;
  url: string;
}

export function EmailTemplateVerifyEmail({ firstName, url }: EmailTemplateVerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-[560px] px-0 pt-5 pb-12">
            <Section className="rounded-xl bg-[#f8f9fa] p-10 text-center">
              <Heading className="mb-3 text-[28px] font-bold text-[#1a1a1a]">
                Confirm your email
              </Heading>
              <Text className="mb-8 text-base leading-6 text-[#666666]">
                Hi {firstName}, click the button below to verify this email address. If you
                didn&apos;t create an account, you can safely ignore this email.
              </Text>
              <Section className="mb-8">
                <Button
                  href={url}
                  className="rounded-md bg-black px-8 py-3 text-base font-bold text-white no-underline"
                >
                  Verify email
                </Button>
              </Section>
              <Text className="text-[13px] leading-5 break-all text-[#999999]">
                Or paste this link into your browser:
                <br />
                <Link href={url} className="text-black underline">
                  {url}
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
