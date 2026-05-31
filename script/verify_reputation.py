#!/usr/bin/env python3
import sys
import json
import argparse
from datetime import datetime

# Fila de entrada simulada representando registros de desenvolvedores do Firestore para saída de auditoria e estatísticas.
audit_mock_data = [
    {"id": "usr_9128", "name": "Thiago Silva", "email": "thiago.dev@konda.tech", "role": "freelancer", "reputation": 180, "verified": True, "created_at": "2026-01-15"},
    {"id": "usr_2019", "name": "Gabriel Mendonça", "email": "gabriel@gmail.com", "role": "freelancer", "reputation": 320, "verified": True, "created_at": "2025-11-20"},
    {"id": "usr_5514", "name": "Juliana Costa", "email": "juliana.costa@tech.io", "role": "freelancer", "reputation": 45, "verified": False, "created_at": "2026-04-10"},
    {"id": "usr_1092", "name": "Marcos Oliveira", "email": "marcos@konda.tech", "role": "admin", "reputation": 500, "verified": True, "created_at": "2025-05-01"},
    {"id": "usr_7721", "name": "Camila Goulart", "email": "camila.g@konda.tech", "role": "freelancer", "reputation": 0, "verified": False, "created_at": "2026-02-18"},
    {"id": "usr_4432", "name": "Bruna Alencar", "email": "bruna.alencar@konda.tech", "role": "freelancer", "reputation": 150, "verified": True, "created_at": "2026-03-05"}
]

def analyze_reputation_ranks(data, min_reputation):
    print("=" * 60)
    print("      KONDA TECH - RELATÓRIO DE AUDITORIA DE REPUTAÇÃO      ")
    print("=" * 60)
    print(f"Data de Geração: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"Filtro Ativo: Reputação mínima >= {min_reputation} pts\n")

    verified_count = 0
    total_reputation = 0
    flagged_users = []
    qualified_devs = []

    for user in data:
        user_rep = user["reputation"]
        total_reputation += user_rep
        
        if user["verified"]:
            verified_count += 1

        # Verifique se há desenvolvedores excelentes
        if user["role"] == "freelancer":
            if user_rep >= min_reputation and user["verified"]:
                qualified_devs.append(user)
            elif user_rep == 0:
                flagged_users.append(user)

    # Listagens de saída
    print("[+] DESENVOLVEDORES QUALIFICADOS E RECOMENDADOS (DESTAQUE):")
    print("-" * 60)
    if not qualified_devs:
        print("    Nenhum contratado atinge todos os critérios de destaque no momento.")
    for dev in sorted(qualified_devs, key=lambda x: x["reputation"], reverse=True):
        print(f"    ⭐ {dev['name']:<20} | E-mail: {dev['email']:<28} | Pontos: {dev['reputation']}")

    print("\n[!] CONTAS COM SUSPEITA OU INATIVIDADE (BAN / INATIVO):")
    print("-" * 60)
    if not flagged_users:
        print("    Excelente! Nenhuma conta possui reputação zerada.")
    for user in flagged_users:
        print(f"    ❌ {user['name']:<20} | E-mail: {user['email']:<28} | Pontos: {user['reputation']}")

    # Visão geral das métricas
    total_users = len(data)
    avg_reputation = total_reputation / total_users if total_users > 0 else 0
    kyc_rate = (verified_count / total_users) * 100 if total_users > 0 else 0

    print("\n" + "=" * 60)
    print("                  MÉTRICAS GERAIS DA BASE                   ")
    print("=" * 60)
    print(f"    - Total de Usuários Mapeados: {total_users}")
    print(f"    - Taxa de Verificação KYC:    {kyc_rate:.1f}%")
    print(f"    - Reputação Média Geral:      {avg_reputation:.1f} pts")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Auditor e Verificador de Reputação Konda Tech")
    parser.add_argument("--min_rep", type=int, default=100, help="Pontuação de reputação mínima para se qualificar como desenvolvedor destaque")
    parser.add_argument("--json_file", type=str, default="", help="Arquivo JSON de entrada caso aplicável para análise externa")
    
    args = parser.parse_args()

    # Se um JSON externo for passado, tente carregá-lo.
    data_to_analyze = audit_mock_data
    if args.json_file:
        try:
            with open(args.json_file, 'r', encoding='utf-8') as f:
                data_to_analyze = json.load(f)
            print(f"[+] Dados carregados com sucesso do arquivo: {args.json_file}")
        except Exception as e:
            print(f"[!] Erro ao abrir arquivo JSON {args.json_file}: {e}. Usando banco simulado padrão.")

    analyze_reputation_ranks(data_to_analyze, args.min_rep)
