import { CreateOrderForm } from '../CreateOrderForm';

export default function CreateOrderFormExample() {
  const handleSubmit = (orderData: any) => {
    console.log('Order submitted:', orderData);
  };

  const handleCancel = () => {
    console.log('Order creation cancelled');
  };

  return (
    <CreateOrderForm 
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}