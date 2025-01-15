import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IHttpRequestOptions,
  } from 'n8n-workflow';
  
  import { NodeConnectionType } from 'n8n-workflow';


  export class StatementReport implements INodeType {
    description: INodeTypeDescription = {
      displayName: 'Relatório de Extrato',
      name: 'relatorioExtrato',
      group: ['transform'],
      version: 1,
      description: 'Realiza a consulta do extrato de um seller vinculado ao PSP',
      defaults: {
        name: 'relatorioExtrato',
      },
      inputs: [NodeConnectionType.Main],
      outputs: [NodeConnectionType.Main],
      credentials: [
        {
          name: 'X-Token-Api',
          required: true,
        },
      ],
      properties: [
        {
          displayName: 'Ambiente da Aplicação',
          name: 'environment',
          type: 'options',
          options: [
            {
              name: 'Sandbox',
              value: 'sandbox',
            },
            {
              name: 'Produção',
              value: 'production',
            },
          ],
          default: 'sandbox',
          required: true,
          description: '',
        },
        {
          displayName: 'CNPJ do Seller',
          name: 'cnpjSeller',
          type: 'string',
          default: '',
          required: true,
          description: 'CNPJ do seller vinculado ao PSP que deseja consultar o extrato',
        },
        {
          displayName: 'Data Inicial',
          name: 'startDate',
          type: 'string',
          default: '',
          required: false,
          description: 'Data inicial da consulta',
        },
        {
          displayName: 'Data Final',
          name: 'endDate',
          type: 'string',
          default: '',
          required: false,
          description: 'Data final da consulta',
        },
        {
          displayName: 'UUID Order',
          name: 'uuidOrder',
          type: 'string',
          default: '',
          required: false,
          description: 'UUID da order a ser consultada',
        },
        {
          displayName: 'UUID Charge',
          name: 'uuidCharge',
          type: 'string',
          default: '',
          required: false,
          description: 'UUID da charge a ser consultada',
        },
      ],
    };
  
    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
      const items = this.getInputData();
      const returnData: INodeExecutionData[] = [];
  
      for (let i = 0; i < items.length; i++) {
        const cnpjSeller = this.getNodeParameter('cnpjSeller', i) as string;
        const startDate = this.getNodeParameter('startDate', i) as string;
        const endDate = this.getNodeParameter('endDate', i) as string;
        const uuidOrder = this.getNodeParameter('uuidOrder', i) as string;
        const uuidCharge = this.getNodeParameter('uuidCharge', i) as string;
        const environment = this.getNodeParameter('environment', i) as string;

        let baseUrl = 'https://api.barte.com.br/v2/report/statements';
        if (environment === 'sandbox') {
            baseUrl = 'https://sandbox-api.barte.com.br/v2/report/statements';
        }

        let body = {};
        if (startDate && endDate) {
          body = {
            cnpj: cnpjSeller,
            startDate: startDate,
            endDate: endDate
          }
        } else if (uuidOrder) {
            body = {
              cnpj: cnpjSeller,
              uuidOrder: uuidOrder
            }
        } else if (uuidCharge) {
            body = {
              cnpj: cnpjSeller,
              uuidCharge: uuidCharge
            }
        }

        const credentials = await this.getCredentials('X-Token-Api');
        if (!credentials || !credentials.token) {
            throw new Error('Credenciais inválidas ou não encontradas.');
        }

        const options: IHttpRequestOptions = {
            method: 'POST',
            url: baseUrl,
            headers: {
            'X-Token-Api': credentials.token as string,
            },
            body: body,
            json: true,
        };

        try {
            const response = await this.helpers.request(options);
            returnData.push({ json: response });
        } catch (error) {
            throw new Error(`Erro ao realizar a solicitação: ${error.message}`);
        }
    }
    return this.prepareOutputData(returnData);
    }
}
