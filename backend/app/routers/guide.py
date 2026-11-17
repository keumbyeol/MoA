from datetime import date
from math import ceil
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.financial_guide import GuideCategory
from app.models.law import Law, LawVersion, LawArticle
from app.models.support_policies import SupportPolicy


router = APIRouter(
    prefix="/api/guides",
    tags=["금융정보 가이드"],
)


# ==========================================
# 1. 금융 가이드 주제
# ==========================================

TOPICS = [
    (
        "minimum-wage",
        "최저임금, 어떻게 확인할까요?",
        "급여·연금",
        "salary-pension",
        "최저임금법",
        ("최저임금", "임금액"),
    ),
    (
        "wage-payment",
        "임금은 언제 어떻게 지급될까요?",
        "급여·연금",
        "salary-pension",
        "근로기준법",
        ("임금 지급", "임금의 지급", "금품 청산"),
    ),
    (
        "national-pension",
        "국민연금 가입과 보험료",
        "급여·연금",
        "salary-pension",
        "국민연금법",
        ("가입자", "연금보험료"),
    ),
    (
        "weekly-holiday",
        "주휴일과 유급휴일 알아보기",
        "수당·근로수당",
        "labor-allowance",
        "근로기준법",
        ("휴일", "유급휴일"),
    ),
    (
        "overtime",
        "연장·야간·휴일근로 수당",
        "수당·근로수당",
        "labor-allowance",
        "근로기준법",
        ("연장근로", "야간근로", "휴일근로", "가산임금"),
    ),
    (
        "annual-leave",
        "연차 유급휴가 알아보기",
        "수당·근로수당",
        "labor-allowance",
        "근로기준법",
        ("연차 유급휴가",),
    ),
    (
        "income-tax",
        "근로소득과 소득세",
        "세금",
        "tax",
        "소득세법",
        ("근로소득", "원천징수"),
    ),
    (
        "tax-deduction",
        "소득공제와 세액공제",
        "세금",
        "tax",
        "소득세법",
        ("소득공제", "세액공제"),
    ),
    (
        "health-insurance",
        "건강보험 가입과 보험료",
        "사회보험",
        "social-insurance",
        "국민건강보험법",
        ("가입자", "보험료"),
    ),
    (
        "employment-insurance",
        "고용보험 적용과 가입",
        "사회보험",
        "social-insurance",
        "고용보험법",
        ("적용", "피보험자"),
    ),
    (
        "unemployment-benefit",
        "구직급여 관련 규정",
        "사회보험",
        "social-insurance",
        "고용보험법",
        ("구직급여", "수급자격"),
    ),
]


# ==========================================
# 2. 사용자용 상세 설명
# ==========================================

TOPIC_CONTENT = {'minimum-wage': {'summary': '최저임금은 아르바이트를 포함한 근로자에게 적용되는 임금의 최저 기준입니다. 시급뿐 아니라 월급도 시간당 금액으로 환산해 '
                             '확인할 수 있습니다.',
                  'sections': [{'title': '누가 적용받나요?',
                                'body': '원칙적으로 근로자를 사용하는 사업장에 적용되며 아르바이트·계약직도 포함됩니다. 근로계약서에 더 낮은 '
                                        '시급을 적었다고 해서 최저임금보다 적게 지급해도 되는 것은 아닙니다.\n'
                                        '\n'
                                        '다만 수습 중인 일부 근로자 등에는 법정 요건에 따른 예외가 있을 수 있습니다.'},
                               {'title': '내 급여가 최저임금 이상인지 확인하기',
                                'body': '시급제: 근로계약서의 시급과 근무한 연도의 법정 최저시급을 비교합니다.\n'
                                        '\n'
                                        '월급제: 최저임금에 포함되는 월 임금을 최저임금 적용 기준시간으로 나누어 시간당 금액을 비교합니다. 주 '
                                        '40시간 근무에 유급주휴 8시간을 포함하는 일반적인 경우 월 환산 기준시간은 약 209시간입니다.\n'
                                        '\n'
                                        '연장·야간·휴일근로 가산수당 등은 최저임금 산입 여부를 별도로 판단해야 합니다.'},
                               {'title': '계산 예시',
                                'body': '예를 들어 해당 연도의 최저시급이 10,000원이고 월 환산 기준시간이 209시간이라면, 비교 기준 '
                                        '월급은 2,090,000원입니다. 이 금액은 설명을 위한 가정이며 실제 적용 연도의 최저임금은 다를 수 '
                                        '있습니다.'},
                               {'title': '적게 받았다면?',
                                'body': '근로계약서, 근무기록, 급여명세서, 입금 내역을 모아 실제 지급액을 확인하세요. 차액이 발생했다면 '
                                        '사업주에게 정정을 요청하거나 고용노동부 1350 및 관할 노동관서에 상담할 수 있습니다.'}]},
 'wage-payment': {'summary': '임금은 원칙적으로 근로자에게 직접, 전액을, 매월 한 번 이상 정해진 날짜에 지급해야 합니다. 퇴사한 경우에도 미지급 임금 '
                             '정산 기한이 있습니다.',
                  'sections': [{'title': '월급은 언제 받아야 하나요?',
                                'body': '근로계약서에 정한 급여일에 지급하는 것이 원칙입니다. 매월 한 번 이상 일정한 날짜에 지급해야 하며, '
                                        '일부 임금에는 법정 예외가 있습니다. 계좌이체로 지급하는 경우에도 지급일과 지급액을 확인할 수 있어야 '
                                        '합니다.'},
                               {'title': '월급에서 공제할 수 있는 금액',
                                'body': '임금은 원칙적으로 전액 지급해야 합니다. 다만 소득세·사회보험료처럼 법령에 근거한 공제나 적법한 '
                                        '단체협약에 따른 공제는 가능합니다.\n'
                                        '\n'
                                        '사업주가 실수에 대한 벌금 명목으로 임금을 임의로 깎는 것은 문제가 될 수 있습니다.'},
                               {'title': '퇴사하면 언제까지 정산하나요?',
                                'body': '퇴직 등으로 지급 사유가 발생하면 원칙적으로 14일 이내에 임금 등 금품을 정산해야 합니다. 특별한 '
                                        '사정이 있는 경우 당사자 간 합의로 기일을 연장할 수 있습니다.'},
                               {'title': '임금이 밀렸을 때',
                                'body': '① 계약서의 지급일과 실제 입금일 확인\n'
                                        '② 근무일·근무시간·급여명세서 정리\n'
                                        '③ 사업주에게 미지급 금액과 지급 예정일 문의\n'
                                        '④ 해결되지 않으면 노동관서에 임금체불 진정 상담\n'
                                        '\n'
                                        '문자나 메신저로 나눈 지급 약속도 보관해 두는 것이 좋습니다.'}]},
 'national-pension': {'summary': '국민연금은 노후 소득을 준비하는 사회보험입니다. 직장가입자는 일반적으로 회사와 근로자가 보험료를 나누어 부담합니다.',
                      'sections': [{'title': '누가 가입하나요?',
                                    'body': '일반적으로 국내 거주 18세 이상 60세 미만 국민이 가입 대상이며, 직장에 다니면 '
                                            '사업장가입자가 될 수 있습니다. 단시간·단기간 근로자는 근무시간과 근무일수 등 별도 기준에 따라 '
                                            '판단합니다.'},
                                   {'title': '보험료는 누가 얼마나 내나요?',
                                    'body': '사업장가입자의 연금보험료는 기준소득월액에 해당 연도의 보험료율을 적용해 산정합니다. 일반적으로 '
                                            '사용자와 근로자가 절반씩 부담합니다.\n'
                                            '\n'
                                            '보험료율은 제도 개정에 따라 달라질 수 있으므로 특정 비율을 모든 연도에 고정 적용하면 안 '
                                            '됩니다.'},
                                   {'title': '나중에 어떤 혜택을 받나요?',
                                    'body': '대표적으로 노령연금이 있으며, 법정 요건에 따라 장애연금과 유족연금도 지급됩니다. 노령연금은 '
                                            '일반적으로 가입기간 10년 이상 등의 수급 요건을 충족해야 합니다. 수급 개시 연령은 출생연도에 '
                                            '따라 다릅니다.'},
                                   {'title': '가입·납부 내역 확인',
                                    'body': '급여명세서의 국민연금 공제액과 국민연금공단의 가입·납부 내역을 비교하세요. 퇴사하거나 소득이 '
                                            '없어졌을 때는 가입 유형 변경이나 납부예외 적용 가능 여부를 확인할 수 있습니다.'}]},
 'weekly-holiday': {'summary': '주휴수당은 일정한 요건을 충족하고 소정근로일을 개근한 근로자에게 보장되는 유급 주휴일의 임금입니다. 아르바이트생도 받을 '
                               '수 있습니다.',
                    'sections': [{'title': '주휴수당을 받을 수 있는 기본 조건',
                                  'body': '① 4주를 평균해 1주 소정근로시간이 15시간 이상이어야 합니다. 근로기간이 4주 미만이면 그 '
                                          '기간을 기준으로 판단합니다.\n'
                                          '② 해당 주에 근로계약으로 정한 소정근로일을 개근해야 합니다.\n'
                                          '\n'
                                          '반드시 한 달 내내 결근이 없어야 하는 것은 아닙니다. 지각·조퇴와 결근도 구분해서 판단합니다.'},
                                 {'title': '주휴수당은 얼마나 받나요?',
                                  'body': '일반적인 주 40시간제 사업장에서 단시간 근로자의 주휴시간은 보통 다음과 같이 계산합니다.\n'
                                          '\n'
                                          '주휴시간 = (1주 소정근로시간 ÷ 40시간) × 8시간\n'
                                          '주휴수당 = 주휴시간 × 통상시급\n'
                                          '\n'
                                          '실제 계산은 근로형태, 소정근로시간 및 적용 규정에 따라 달라질 수 있습니다.'},
                                 {'title': '계산 예시',
                                  'body': '주 20시간을 근무하고 시급이 10,000원이라면:\n'
                                          '주휴시간 = 20 ÷ 40 × 8 = 4시간\n'
                                          '주휴수당 = 4 × 10,000원 = 40,000원\n'
                                          '\n'
                                          '일반적인 주 40시간제 사업장을 가정한 예시입니다.'},
                                 {'title': '헷갈리기 쉬운 상황',
                                  'body': '• 주 10시간 근무: 원칙적으로 주휴일 적용 대상이 아닙니다.\n'
                                          '• 주 20시간 근무·소정근로일 개근: 다른 요건도 충족하면 지급 대상이 될 수 있습니다.\n'
                                          '• 근무일이 주마다 달라지는 경우: 실제 출근시간뿐 아니라 계약상 소정근로시간과 근무일을 확인해야 '
                                          '합니다.\n'
                                          '\n'
                                          '근로계약·근무 형태에 따라 적용 결과가 달라질 수 있습니다.'}]},
 'overtime': {'summary': '연장·야간·휴일근로에는 일정한 조건에서 통상임금의 가산수당이 붙습니다. 근무 시간대와 사업장 규모에 따라 적용이 달라집니다.',
              'sections': [{'title': '어떤 근무에 가산수당이 붙나요?',
                            'body': '• 연장근로: 원칙적으로 1일 8시간 또는 1주 40시간을 넘는 근로\n'
                                    '• 야간근로: 오후 10시부터 다음 날 오전 6시 사이의 근로\n'
                                    '• 휴일근로: 법정·약정 휴일에 하는 근로\n'
                                    '\n'
                                    '휴게시간은 실제 근로시간에서 제외하며, 단시간 근로자에게는 별도의 초과근로 규정이 적용될 수 있습니다.'},
                           {'title': '가산수당 기준',
                            'body': '근로기준법 제56조가 적용되는 경우:\n'
                                    '• 연장근로: 통상임금의 50% 이상 가산\n'
                                    '• 야간근로: 통상임금의 50% 이상 가산\n'
                                    '• 휴일근로 8시간 이내: 통상임금의 50% 이상 가산\n'
                                    '• 휴일근로 8시간 초과분: 통상임금의 100% 이상 가산\n'
                                    '\n'
                                    '연장·야간·휴일 요건이 겹치면 해당 가산분이 함께 적용될 수 있습니다.'},
                           {'title': '계산 예시',
                            'body': '통상시급 10,000원, 평일 연장근로 2시간, 제56조 적용 사업장이라면:\n'
                                    '10,000원 × 2시간 × 1.5 = 30,000원\n'
                                    '\n'
                                    '이 금액은 해당 2시간에 대한 기본임금과 연장 가산분을 합한 예시입니다.'},
                           {'title': '아르바이트도 해당되나요?',
                            'body': '근로형태가 아르바이트라고 해서 무조건 제외되는 것은 아닙니다. 다만 근로기준법 제56조의 법정 가산수당은 '
                                    '원칙적으로 상시근로자 5인 이상 사업장에 적용됩니다. 5인 미만 사업장은 별도 약정 여부 등을 확인해야 '
                                    '합니다.'}]},
 'annual-leave': {'summary': '연차 유급휴가는 일정 기간 근무한 근로자에게 주어지는 유급휴가입니다. 근속기간과 출근율에 따라 발생 일수가 달라집니다.',
                  'sections': [{'title': '1년 미만 근무했다면?',
                                'body': '계속근로기간이 1년 미만인 근로자는 1개월 개근할 때마다 원칙적으로 1일의 연차 유급휴가가 발생합니다. '
                                        '최대 11일까지 발생할 수 있습니다.'},
                               {'title': '1년 이상 근무했다면?',
                                'body': '1년간 출근율이 80% 이상이면 원칙적으로 15일의 연차가 발생합니다. 80% 미만인 경우에는 1개월 '
                                        '개근 시 1일의 휴가가 발생할 수 있습니다.\n'
                                        '\n'
                                        '3년 이상 계속 근로한 경우에는 법정 기준에 따라 가산휴가가 붙으며 총 25일이 상한입니다.'},
                               {'title': '연차를 사용할 때',
                                'body': '근로자는 원칙적으로 원하는 시기에 연차를 청구할 수 있습니다. 다만 그 시기에 휴가를 주는 것이 사업 '
                                        '운영에 막대한 지장을 주는 경우 사용자가 시기를 변경할 수 있습니다. 연차를 사용한 날에는 법정 기준에 '
                                        '따른 임금이 지급됩니다.'},
                               {'title': '남은 연차는 돈으로 받을 수 있나요?',
                                'body': '사용하지 않은 연차에 대한 수당은 발생·소멸 시점과 적법한 연차 사용촉진 여부 등에 따라 달라집니다. '
                                        '연차 사용 내역, 입사일, 퇴사일을 함께 확인하세요.\n'
                                        '\n'
                                        '근로기준법상 연차 규정은 원칙적으로 상시근로자 5인 이상 사업장에 적용되고, 초단시간 근로자에게는 '
                                        '적용이 제한될 수 있습니다.'}]},
 'income-tax': {'summary': '월급에서 소득세가 빠지는 이유는 회사가 급여를 지급할 때 세금을 미리 원천징수하기 때문입니다. 연말정산에서 실제 세액을 다시 '
                           '계산합니다.',
                'sections': [{'title': '급여에서 어떤 세금이 빠지나요?',
                              'body': '일반적인 근로소득 급여명세서에는 근로소득세와 지방소득세가 공제될 수 있습니다. 국민연금·건강보험·고용보험 '
                                      '공제액은 세금이 아니라 사회보험료입니다.'},
                             {'title': '소득세는 어떻게 정해지나요?',
                              'body': '월급에서 원천징수하는 근로소득세는 일반적으로 근로소득 간이세액표 등을 기준으로 계산합니다. 급여 수준과 '
                                      '공제대상 가족 수 등에 따라 금액이 달라집니다.\n'
                                      '\n'
                                      '같은 월급을 받더라도 모든 사람의 원천징수액이 같지는 않습니다.'},
                             {'title': '연말정산은 왜 하나요?',
                              'body': '매달 미리 낸 세금과 1년간의 소득·공제 내역을 반영해 계산한 최종 세액을 비교합니다. 미리 낸 세금이 더 '
                                      '많으면 환급받고, 적으면 추가 납부할 수 있습니다.'},
                             {'title': '아르바이트·프리랜서는 똑같나요?',
                              'body': '근로계약에 따른 근로소득인지, 일용근로소득인지, 사업소득인지에 따라 원천징수와 정산 방식이 다릅니다. 흔히 '
                                      '말하는 3.3% 원천징수는 모든 아르바이트에 적용되는 방식이 아닙니다. 계약의 명칭보다 실제 근로관계와 '
                                      '소득 유형이 중요합니다.'}]},
 'tax-deduction': {'summary': '소득공제는 세금을 매기는 소득을 줄이고, 세액공제는 계산된 세금을 직접 줄입니다. 공제 요건에 따라 연말정산 환급액이 '
                              '달라질 수 있습니다.',
                   'sections': [{'title': '소득공제와 세액공제의 차이',
                                 'body': '소득공제: 과세표준을 계산하기 전에 소득에서 일정 금액을 빼는 방식입니다.\n'
                                         '세액공제: 산출된 세금에서 일정 금액을 빼는 방식입니다.\n'
                                         '\n'
                                         '둘 다 세금을 줄일 수 있지만 실제 절세 효과는 개인의 소득과 적용 요건에 따라 다릅니다.'},
                                {'title': '대표적인 공제 항목',
                                 'body': '• 소득공제 예시: 인적공제, 국민연금 보험료 공제, 신용카드 등 사용금액 소득공제\n'
                                         '• 세액공제 예시: 보험료·의료비·교육비·기부금·연금계좌 관련 세액공제\n'
                                         '\n'
                                         '항목별 소득요건, 지출 요건, 한도 및 중복공제 제한이 있습니다.'},
                                {'title': '간단한 계산 예시',
                                 'body': '과세표준을 계산하기 전 소득에서 100만 원을 소득공제하면 과세표준이 100만 원 줄어드는 '
                                         '방식입니다.\n'
                                         '\n'
                                         '세액공제 10만 원이 적용된다면 산출세액 등에서 법정 방식에 따라 10만 원을 공제하는 방식입니다. '
                                         '실제 환급액이 각각 100만 원, 10만 원이라는 뜻은 아닙니다.'},
                                {'title': '연말정산 준비하기',
                                 'body': '국세청 연말정산 간소화 자료를 확인하고, 간소화 자료에 누락될 수 있는 증빙은 별도로 챙기세요. '
                                         '부양가족 공제나 월세 세액공제 등은 별도의 자격요건이 있으므로 본인에게 해당하는지 확인하는 것이 '
                                         '중요합니다.'}]},
 'health-insurance': {'summary': '건강보험은 병원 진료비 등의 부담을 줄여주는 사회보험입니다. 직장가입자·지역가입자·피부양자 여부에 따라 보험료 '
                                 '부담이 달라집니다.',
                      'sections': [{'title': '건강보험은 어떻게 가입하나요?',
                                    'body': '직장에 다니는 근로자는 일반적으로 직장가입자가 됩니다. 직장가입자에 해당하지 않으면 지역가입자가 '
                                            '되거나 요건을 충족할 경우 가족의 피부양자로 인정될 수 있습니다.\n'
                                            '\n'
                                            '단시간·단기간 근로자 등은 별도의 직장가입 적용 기준이 있습니다.'},
                                   {'title': '보험료는 누가 내나요?',
                                    'body': '일반적인 직장가입자의 보수월액보험료는 근로자와 사용자가 절반씩 부담합니다. 장기요양보험료가 함께 '
                                            '부과될 수 있습니다.\n'
                                            '\n'
                                            '지역가입자는 소득과 재산 등 법정 산정 기준에 따라 보험료가 결정됩니다.'},
                                   {'title': '건강보험으로 무엇을 지원받나요?',
                                    'body': '보험급여 대상 진료를 받으면 건강보험이 의료비 일부를 부담합니다. 진료 종류에 따라 본인부담금이 '
                                            '있으며 비급여 항목은 별도로 부담할 수 있습니다. 건강검진 등도 법정 기준에 따라 제공됩니다.'},
                                   {'title': '가입 여부·보험료 확인',
                                    'body': '급여명세서의 건강보험·장기요양보험 공제액을 확인하고, 국민건강보험공단에서 자격득실확인서와 보험료 '
                                            '납부 내역을 조회할 수 있습니다.'}]},
 'employment-insurance': {'summary': '고용보험은 실직했을 때의 구직급여와 재취업 지원 등을 위한 제도입니다. 아르바이트생도 근무조건에 따라 가입 '
                                     '대상이 될 수 있습니다.',
                          'sections': [{'title': '누가 가입 대상인가요?',
                                        'body': '원칙적으로 고용보험 적용 사업장에서 일하는 근로자가 대상입니다. 다만 일정한 초단시간 '
                                                '근로자 등은 적용 제외될 수 있으며, 계속근로기간과 근무형태에 따라 예외가 있습니다.'},
                                       {'title': '주 15시간 미만이면 무조건 제외되나요?',
                                        'body': '원칙적으로 월 소정근로시간 60시간 미만 또는 주 소정근로시간 15시간 미만인 근로자는 '
                                                '적용 제외 대상이 될 수 있습니다. 다만 3개월 이상 계속 근로하는 사람과 일용근로자 '
                                                '등에는 예외가 있으므로 근무기간까지 함께 봐야 합니다.'},
                                       {'title': '보험료는 어떻게 내나요?',
                                        'body': '근로자의 급여에서 실업급여 보험료의 근로자 부담분이 공제될 수 있습니다. 사용자는 법정 '
                                                '사용자 부담분을 별도로 납부하며 고용안정·직업능력개발사업 보험료도 부담합니다. 요율은 '
                                                '적용 연도와 사업장 조건에 따라 확인해야 합니다.'},
                                       {'title': '가입 여부 확인하기',
                                        'body': '고용24 또는 근로복지공단 관련 서비스에서 고용보험 피보험자격 이력을 확인할 수 '
                                                '있습니다. 실제로 근무했는데 가입 내역이 없다면 근로계약서와 급여명세서를 바탕으로 확인을 '
                                                '요청할 수 있습니다.'}]},
 'unemployment-benefit': {'summary': '구직급여는 실직 후 재취업을 준비하는 동안 일정 요건을 충족한 사람에게 지급됩니다. 고용보험 가입 이력과 '
                                     '퇴사 사유가 중요합니다.',
                          'sections': [{'title': '기본 수급 조건',
                                        'body': '일반적인 근로자는 이직일 이전 18개월 동안 피보험 단위기간이 통산 180일 이상이어야 '
                                                '합니다. 초단시간 근로자 등에는 기준기간 특례가 있을 수 있습니다.\n'
                                                '\n'
                                                '또한 일할 의사와 능력이 있지만 취업하지 못한 상태여야 하고, 적극적으로 재취업 활동을 '
                                                '해야 합니다.'},
                                       {'title': '자진퇴사하면 못 받나요?',
                                        'body': '개인 사정으로 자발적으로 퇴사한 경우에는 원칙적으로 수급이 제한됩니다. 다만 임금체불, '
                                                '근로조건 저하, 질병·돌봄 등 법령에서 인정하는 정당한 이직 사유가 있다면 예외적으로 '
                                                '인정될 수 있습니다. 구체적인 사유와 증빙이 중요합니다.'},
                                       {'title': '얼마나, 얼마나 오래 받나요?',
                                        'body': '구직급여일액은 일반적으로 이직 전 평균임금의 60%를 기준으로 산정하며 법정 상한·하한이 '
                                                '적용됩니다. 지급일수는 연령과 고용보험 가입기간 등에 따라 일반적으로 120~270일 '
                                                '범위에서 결정됩니다.'},
                                       {'title': '신청은 어떻게 하나요?',
                                        'body': '① 회사의 고용보험 상실 신고·이직확인서 처리 여부 확인\n'
                                                '② 고용24에서 구직등록 및 수급자격 신청 관련 절차 확인\n'
                                                '③ 안내에 따라 수급자격 교육·신청 진행\n'
                                                '④ 실업인정일마다 재취업 활동 내역 제출\n'
                                                '\n'
                                                '구직급여는 원칙적으로 퇴직 다음 날부터 12개월의 수급기간 안에 지급받아야 하므로 신청을 '
                                                '미루지 않는 것이 좋습니다.'}]}}


# ==========================================
# 3. 공통 데이터 변환 함수
# ==========================================

def category_dict(slug, name, category_ids):
    return {
        "id": category_ids.get(slug, 0),
        "slug": slug,
        "name": name,
    }


def category_ids_for(db: Session):
    categories = db.scalars(
        select(GuideCategory)
    ).all()

    return {
        category.slug: category.id
        for category in categories
    }


def policy_summary(policy: SupportPolicy):
    return (
        policy.summary
        or policy.support_description
        or "지원 내용과 신청 조건을 확인해 보세요."
    ).strip()[:300]


def policy_card(policy: SupportPolicy, category_ids):
    return {
        "id": f"policy-{policy.id}",
        "slug": f"policy-{policy.id}",
        "title": policy.title,
        "summary": policy_summary(policy),
        "category": category_dict(
            "government-support",
            "정부지원",
            category_ids,
        ),
        "audience": None,
        "published_at": None,
        "reviewed_at": policy.source_updated_at,
        "updated_at": policy.updated_at,
        "kind": "policy",
    }


def topic_card(topic, category_ids):
    (
        slug,
        title,
        category_name,
        category_slug,
        law_name,
        terms,
    ) = topic

    content = TOPIC_CONTENT.get(slug)

    summary = (
        content["summary"]
        if content
        else f"{law_name} 관련 내용을 확인해 보세요."
    )

    return {
        "id": f"topic-{slug}",
        "slug": f"topic-{slug}",
        "title": title,
        "summary": summary,
        "category": category_dict(
            category_slug,
            category_name,
            category_ids,
        ),
        "audience": None,
        "published_at": None,
        "reviewed_at": None,
        "updated_at": None,
        "kind": "topic",
    }


def all_cards(db: Session, category_ids):
    topics = [
        topic_card(topic, category_ids)
        for topic in TOPICS
    ]

    policies = db.scalars(
        select(SupportPolicy)
    ).all()

    return topics + [
        policy_card(policy, category_ids)
        for policy in policies
    ]


def field(label, value):
    if value is not None and str(value).strip():
        return f"{label}\n{str(value).strip()}"

    return None


# ==========================================
# 4. 법령 버전 조회
# ==========================================

def get_current_version(db: Session, law_id: int):
    today = date.today()

    stmt = select(LawVersion).where(
        LawVersion.law_id == law_id
    )

    current_version = db.scalar(
        stmt.where(
            LawVersion.effective_from <= today,
            or_(
                LawVersion.effective_to.is_(None),
                LawVersion.effective_to >= today,
            ),
        )
        .order_by(
            LawVersion.effective_from.desc(),
            LawVersion.id.desc(),
        )
        .limit(1)
    )

    if current_version is not None:
        return current_version

    return db.scalar(
        stmt.order_by(
            LawVersion.effective_from.desc(),
            LawVersion.id.desc(),
        ).limit(1)
    )


# ==========================================
# 5. 카테고리 조회
# ==========================================

@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
):
    categories = db.scalars(
        select(GuideCategory)
        .where(GuideCategory.is_active.is_(True))
        .order_by(
            GuideCategory.sort_order,
            GuideCategory.id,
        )
    ).all()

    policy_count = db.scalar(
        select(func.count(SupportPolicy.id))
    ) or 0

    result = []

    for category in categories:
        if category.slug == "government-support":
            count = policy_count
        else:
            count = sum(
                1
                for topic in TOPICS
                if topic[3] == category.slug
            )

        result.append({
            "id": category.id,
            "slug": category.slug,
            "name": category.name,
            "count": count,
        })

    return {
        "total": sum(
            item["count"]
            for item in result
        ),
        "categories": result,
    }


# ==========================================
# 6. 가이드 목록 조회
# ==========================================

@router.get("")
def get_guides(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=9, ge=1, le=100),
    category: str | None = Query(default=None),
    keyword: str | None = Query(default=None),
    sort: Literal[
        "latest", "oldest", "title"
    ] = "latest",
    db: Session = Depends(get_db),
):
    cards = all_cards(
        db,
        category_ids_for(db),
    )

    if category and category != "all":
        cards = [
            card
            for card in cards
            if card["category"]["slug"] == category
        ]

    if keyword and keyword.strip():
        search_text = keyword.strip().casefold()

        cards = [
            card
            for card in cards
            if search_text in (
                card["title"] + " " + card["summary"]
            ).casefold()
        ]

    if sort == "title":
        cards.sort(
            key=lambda card: (
                card["title"],
                card["id"],
            )
        )
    else:
        cards.sort(
            key=lambda card: (
                str(card["updated_at"] or ""),
                card["id"],
            ),
            reverse=(sort == "latest"),
        )

        if (
            sort == "latest"
            and not keyword
            and (not category or category == "all")
        ):
            cards.sort(
                key=lambda card: card["kind"] != "topic"
            )

    total = len(cards)

    start = (page - 1) * size
    end = page * size

    return {
        "items": cards[start:end],
        "pagination": {
            "page": page,
            "size": size,
            "total": total,
            "total_pages": ceil(total / size),
            "has_next": page * size < total,
            "has_previous": page > 1,
        },
    }


# ==========================================
# 7. 가이드 상세 조회
# ==========================================

@router.get("/{guide_id}")
def get_guide_detail(
    guide_id: str,
    db: Session = Depends(get_db),
):
    category_ids = category_ids_for(db)

    # --------------------------------------
    # 정부지원 정책 상세
    # --------------------------------------

    if guide_id.startswith("policy-"):
        raw_id = guide_id.removeprefix("policy-")

        if not raw_id.isdecimal():
            raise HTTPException(
                status_code=404,
                detail="해당 지원정책을 찾을 수 없습니다.",
            )

        policy = db.get(
            SupportPolicy,
            int(raw_id),
        )

        if policy is None:
            raise HTTPException(
                status_code=404,
                detail="해당 지원정책을 찾을 수 없습니다.",
            )

        sections = [
            field(
                "지원 내용",
                policy.support_description,
            ),
            field(
                "지원 대상 및 자격",
                policy.eligibility_text,
            ),
            field(
                "소득 조건",
                policy.income_condition_text,
            ),
            field(
                "제외 대상",
                policy.exclusion_text,
            ),
            field(
                "신청 기간",
                policy.application_period_text,
            ),
            field(
                "신청 방법",
                policy.application_method,
            ),
            field(
                "제공 기관",
                policy.provider_name,
            ),
            field(
                "운영 기관",
                policy.operator_name,
            ),
        ]

        references = []

        for title, url in (
            ("신청 사이트", policy.application_url),
            ("공식 안내", policy.reference_url),
        ):
            if not url:
                continue

            if not url.startswith(
                ("https://", "http://")
            ):
                continue

            if any(
                reference["url"] == url
                for reference in references
            ):
                continue

            references.append({
                "id": len(references) + 1,
                "type": "POLICY",
                "title": title,
                "url": url,
                "accessed_at": None,
                "effective_on": None,
            })

        return {
            **policy_card(
                policy,
                category_ids,
            ),
            "body": "\n\n".join(
                filter(None, sections)
            ) or "제공된 상세 정보가 없습니다.",
            "sections": [],
            "law_articles": [],
            "references": references,
        }

    # --------------------------------------
    # 법령 관련 주제 상세
    # --------------------------------------

    if guide_id.startswith("topic-"):
        slug = guide_id.removeprefix("topic-")

        topic = next(
            (
                item
                for item in TOPICS
                if item[0] == slug
            ),
            None,
        )

        if topic is None:
            raise HTTPException(
                status_code=404,
                detail="해당 주제를 찾을 수 없습니다.",
            )

        content = TOPIC_CONTENT.get(slug)

        if content is None:
            raise HTTPException(
                status_code=404,
                detail="해당 주제의 설명이 준비되지 않았습니다.",
            )

        law = db.scalar(
            select(Law).where(
                Law.law_name == topic[4]
            )
        )

        if law is None:
            raise HTTPException(
                status_code=404,
                detail="관련 법령이 저장되어 있지 않습니다.",
            )

        version = get_current_version(
            db,
            law.id,
        )

        if version is None:
            raise HTTPException(
                status_code=404,
                detail="관련 법령 버전을 찾을 수 없습니다.",
            )

        # 조문 제목에서 주제와 관련된 내용을 검색
        terms = topic[5]

        matches = or_(
            *[
                LawArticle.heading.ilike(
                    f"%{term}%"
                )
                for term in terms
            ]
        )

        articles = db.scalars(
            select(LawArticle)
            .where(
                LawArticle.law_version_id == version.id,
                matches,
            )
            .order_by(
                LawArticle.id.asc(),
            )
            .limit(5)
        ).all()

        law_articles = [
            {
                "id": article.id,
                "article_no": article.article_no,
                "heading": article.heading,
                "official_text": article.official_text,
            }
            for article in articles
        ]

        references = []

        if (
            law.official_url
            and law.official_url.startswith(
                ("https://", "http://")
            )
        ):
            references.append({
                "id": 1,
                "type": "LAW",
                "title": law.law_name,
                "url": law.official_url,
                "accessed_at": None,
                "effective_on": version.effective_from,
            })

        body = "\n\n".join(
            (
                f"{section['title']}\n"
                f"{section['body']}"
            )
            for section in content["sections"]
        )

        return {
            **topic_card(
                topic,
                category_ids,
            ),
            "summary": content["summary"],
            "body": body,
            "sections": content["sections"],
            "law_articles": law_articles,
            "references": references,
            "updated_at": version.source_checked_at,
            "reviewed_at": version.source_checked_at,
        }

    raise HTTPException(
        status_code=404,
        detail="해당 금융정보를 찾을 수 없습니다.",
    )