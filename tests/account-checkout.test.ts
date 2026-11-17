import test from 'node:test';
import assert from 'node:assert/strict';
import { blankCustomer, customerForAccount, type AccountUser } from '../src/lib/account';

const user: AccountUser = { id: 'account-a', name: 'Marina Passira', email: 'marina@teste.local', phone: '(81) 98888-7777', cpf: '529.982.247-25' };

test('checkout fills all identity fields from the account instead of guest or blank browser drafts', () => {
  const guest = { ...blankCustomer, name: 'Contato antigo', phone: '(11) 99999-9999', cpf: '111.444.777-35', street: 'Rua do pedido', note: 'Sem cebola' };
  const result = customerForAccount(user, guest, null);
  assert.equal(result.name, user.name); assert.equal(result.phone, user.phone); assert.equal(result.cpf, user.cpf);
  assert.equal(result.street, guest.street); assert.equal(result.note, guest.note);
  assert.equal(customerForAccount(user, blankCustomer, user.id).cpf, user.cpf);
});

test('checkout preserves edits from the same account and excludes another account personal draft', () => {
  const edited = { ...blankCustomer, name: 'Nome editado', phone: '(81) 99999-9999', cpf: '111.444.777-35', street: 'Endereço privado' };
  assert.deepEqual(customerForAccount(user, edited, user.id), edited);
  assert.deepEqual(customerForAccount(user, edited, 'account-b'), { ...blankCustomer, name: user.name, phone: user.phone, cpf: user.cpf });
});

test('legacy accounts leave CPF empty until the customer supplies it', () => {
  assert.equal(customerForAccount({ ...user, cpf: null }, null, null).cpf, '');
});
