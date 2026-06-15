import { shapePublicOrder } from './public-order';

describe('shapePublicOrder', () => {
  const order = {
    orderNumber: 'SWG-7K2P9QXM',
    status: 'processing',
    createdAt: new Date('2026-06-01T10:00:00.000Z'),
    // Fields that must NEVER reach the public payload:
    shipName: 'Ama Mensah',
    shipAddress: '12 Liberation Rd',
    shipCity: 'Accra',
    shipPhone: '0241234567',
    total: 50000,
  };
  const items = [
    {
      productName: 'Rice Cooker',
      variantName: '1.8L',
      quantity: 2,
      isPreorder: false,
      preorderShipEstimate: null,
      unitPrice: 12000, // must be dropped
    },
  ];

  it('returns only safe fields and an ISO createdAt', () => {
    const result = shapePublicOrder(order, items, 'GD01');
    expect(result).toEqual({
      orderNumber: 'SWG-7K2P9QXM',
      status: 'processing',
      createdAt: '2026-06-01T10:00:00.000Z',
      shippingMark: 'GD01',
      items: [
        {
          productName: 'Rice Cooker',
          variantName: '1.8L',
          quantity: 2,
          isPreorder: false,
          preorderShipEstimate: null,
        },
      ],
    });
  });

  it('omits personal delivery fields and item prices', () => {
    const result = shapePublicOrder(order, items, 'GD01');
    const json = JSON.stringify(result);
    expect(json).not.toContain('Ama Mensah');
    expect(json).not.toContain('Liberation');
    expect(json).not.toContain('0241234567');
    expect(json).not.toContain('12000');
    expect(result.items[0]).not.toHaveProperty('unitPrice');
  });
});
