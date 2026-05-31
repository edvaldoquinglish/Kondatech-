#!/usr/bin/env python3
import os
import sys
import argparse
import subprocess
from datetime import datetime

# Ferramenta auxiliar para instalar automaticamente as dependências ausentes (ReportLab)
def install_and_import(package_name):
    try:
        __import__(package_name)
    except ImportError:
        print(f"[*] Instalação do módulo necessário '{package_name}' em andamento...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package_name])
            print(f"[+] Módulo '{package_name}' instalado com sucesso!")
        except Exception as e:
            print(f"[!] Erro ao instalar '{package_name}' de forma automática: {e}")
            print(f"[!] Por favor, execute manualmente: pip install {package_name}")
            sys.exit(1)

# Certifique-se de que o ReportLab esteja disponível para gerar PDFs de alta qualidade.
install_and_import("reportlab")

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

def create_pdf(args):
    pdf_filename = args.output
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    story = []
    styles = getSampleStyleSheet()

    # Cores da marca que combinam com "Konda Tech" (cinza ardósia, azul escuro, detalhes em verde-azulado)
    c_primary = colors.HexColor("#0f172a")    # Deep slate
    c_secondary = colors.HexColor("#0d9488")  # Teal accent
    c_text_dark = colors.HexColor("#1e293b")  # Dark gray
    c_gray_light = colors.HexColor("#f8fafc") # Warm off-white
    c_border = colors.HexColor("#e2e8f0")     # Light gray border

    # Estilos de tipografia
    style_title = ParagraphStyle(
        name='TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=c_primary,
        spaceAfter=4
    )

    style_subtitle = ParagraphStyle(
        name='SubTitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=c_secondary,
        leading=12,
        spaceAfter=15
    )

    style_header_doc = ParagraphStyle(
        name='HeaderDocStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=c_primary,
        alignment=TA_RIGHT
    )

    style_ref_doc = ParagraphStyle(
        name='RefDocStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=9,
        textColor=colors.HexColor("#64748b"),
        alignment=TA_RIGHT
    )

    style_section_header = ParagraphStyle(
        name='SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor("#475569"),
        spaceAfter=6
    )

    style_body_text = ParagraphStyle(
        name='BodyTextStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=c_text_dark,
        leading=14
    )

    style_body_bold = ParagraphStyle(
        name='BodyBoldStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=c_primary,
        leading=14
    )

    style_clause_header = ParagraphStyle(
        name='ClauseHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.HexColor("#b45309"), # Amber 700
        spaceAfter=4
    )

    style_clause_text = ParagraphStyle(
        name='ClauseText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        textColor=colors.HexColor("#78350f"), # Amber 900
        leading=11
    )

    # 1.Linha de cabeçalho (logotipo e etiqueta do documento)
    header_data = [
        [
            Paragraph("KONDA TECH", style_title),
            Paragraph("DOCUMENTO DE TRANSAÇÃO", style_header_doc)
        ],
        [
            Paragraph("PLATAFORMA CERTIFICADA DE ESCROW", style_subtitle),
            Paragraph(f"Ref: {args.ref_id.upper()}", style_ref_doc)
        ]
    ]
    
    header_table = Table(header_data, colWidths=[270, 270])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,1), (-1,1), 15),
        ('LINEBELOW', (0,1), (1,1), 1.5, c_primary),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 15))

    # 2. Tabela de informações dos atores
    actors_info_data = [
        [
            Paragraph("CONTRATANTE (CLIENTE)", style_section_header),
            Paragraph("CONTRATADO (DEVELOPER)", style_section_header)
        ],
        [
            Paragraph(f"<b>ID do Cliente:</b> {args.client_id}<br/>Konda Tech Registrado", style_body_text),
            Paragraph(f"<b>ID do Prestador:</b> {args.freelancer_id}<br/>Konda Tech Verificado", style_body_text)
        ]
    ]
    
    actors_table = Table(actors_info_data, colWidths=[270, 270])
    actors_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,1), (-1,1), 15),
    ]))
    story.append(actors_table)
    story.append(Spacer(1, 10))

    # 3. Detalhes do objeto do projeto dentro da caixa
    project_payload = [
        [Paragraph("OBJETO TÉCNICO & ESCOPO", style_section_header)],
        [Paragraph(f"<b>Projeto:</b> {args.project_title}", style_body_bold)],
        [Paragraph(f"Contrato formalizado e assegurado digitalmente em conformidade com as regras gerais da comunidade Konda Tech.", style_body_text)]
    ]
    project_table = Table(project_payload, colWidths=[540])
    project_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_gray_light),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (-1,-1), 15),
        ('RIGHTPADDING', (0,0), (-1,-1), 15),
    ]))
    story.append(project_table)
    story.append(Spacer(1, 15))

    # 4. Grade de Cálculos Financeiros
    bg_yellow_light = colors.HexColor("#fef3c7")
    financial_data = [
        [
            Paragraph("DETALHAMENTO FINANCEIRO", style_section_header),
            "", ""
        ],
        [
            Paragraph("<b>VALOR BRUTO RESERVADO (ESCROW)</b>", style_body_bold),
            "",
            Paragraph(f"R$ {float(args.amount):,.2f}".replace(",", "X").replace(".", ",").replace("X", "."), style_body_bold)
        ],
        [
            Paragraph("TAXA ADMINISTRATIVA (10% PLATAFORMA)", style_body_text),
            "",
            Paragraph(f"- R$ {float(args.fee):,.2f}".replace(",", "X").replace(".", ",").replace("X", "."), style_body_text)
        ],
        [
            Paragraph("<b>SALDO LÍQUIDO A SER LIBERADO</b>", style_body_bold),
            "",
            Paragraph(f"R$ {float(args.freelancer_amount):,.2f}".replace(",", "X").replace(".", ",").replace("X", "."), style_body_bold)
        ]
    ]
    financial_table = Table(financial_data, colWidths=[350, 50, 140])
    financial_table.setStyle(TableStyle([
        ('SPAN', (0,0), (2,0)),
        ('LINEBELOW', (0,0), (2,0), 1, c_border),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,1), (-1,1), c_gray_light),
        ('BACKGROUND', (0,3), (-1,3), bg_yellow_light),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (2,1), (2,-1), 15),
        ('ALIGN', (2,1), (2,-1), 'RIGHT'),
    ]))
    story.append(financial_table)
    story.append(Spacer(1, 20))

    # 5. Termos Legais de Escrow
    clauses_data = [
        [
            Paragraph("DECLARAÇÃO DE CLÁUSULAS ESCROW (KONDA SECURE PROTOCOL):", style_clause_header)
        ],
        [
            Paragraph("1. Os presentes fundos foram integralmente custodiados sob o protocolo de Escrow (garantia legal) da Konda Tech.<br/>"
                      "2. A liberação do saldo para o profissional técnico é irrevogável após a autorização manual do cliente contratante.<br/>"
                      "3. Eventuais arbitragens em disputas judiciais ou técnicas estão sob competência exclusiva do colegiado administrativo do ecossistema.", style_clause_text)
        ]
    ]
    clauses_table = Table(clauses_data, colWidths=[540])
    clauses_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fef3c7")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#f59e0b")),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 15),
        ('RIGHTPADDING', (0,0), (-1,-1), 15),
    ]))
    story.append(clauses_table)
    story.append(Spacer(1, 30))

    # 6. Rodapé corporativo com assinatura hash criptográfica
    hash_signature = f"SEC___{args.ref_id.upper()[:12]}_{datetime.now().strftime('%Y%H%M')}"
    footer_data = [
        [
            Paragraph(f"Plataforma Digital Konda Tech<br/>Documento gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}", style_body_text),
            Paragraph(f"Chave Assinatura Privada:<br/><b>{hash_signature}</b>", style_ref_doc)
        ]
    ]
    footer_table = Table(footer_data, colWidths=[270, 270])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('TOPPADDING', (0,0), (-1,-1), 15),
        ('LINEABOVE', (0,0), (1,0), 0.5, c_border),
    ]))
    story.append(footer_table)

    # Compila o documento final.
    doc.build(story)
    print(f"[+] Relatório PDF exportado com sucesso: '{pdf_filename}'")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Konda Tech - PDF Report Generator")
    parser.add_argument("--ref_id", default="KON_99AB2C3D", help="ID/Referência único do escrow")
    parser.add_argument("--client_id", default="cli_718293751", help="ID do cliente contratante")
    parser.add_argument("--freelancer_id", default="dev_829102931", help="ID do desenvolvedor contratado")
    parser.add_argument("--project_title", default="Plataforma E-Commerce Completa com Meio de Pagamento", help="Título do projeto")
    parser.add_argument("--amount", default="5000.00", help="Valor total do escrow (bruto)")
    parser.add_argument("--fee", default="500.00", help="Taxa administrativa da plataforma")
    parser.add_argument("--freelancer_amount", default="4500.00", help="Valor líquido a ser liberado")
    parser.add_argument("--output", default="relatorio_contrato_konda.pdf", help="Nome do arquivo PDF de saída")

    args = parser.parse_args()
    create_pdf(args)
