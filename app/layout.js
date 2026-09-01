import "./globals.css";

export const metadata = {
  title: "Prompts para a Cynthia Bittow 🦙",
  description: "Ferramenta feita com carinho para a Cynthia gerar prompts prontos a usar com a IA, para relatórios e apresentações imobiliárias em Lisboa.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-PT">
      <body>{children}</body>
    </html>
  );
}
