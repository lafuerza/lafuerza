import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FormRow,
  LoginAndSignupLayout,
  PasswordRow,
  Title,
} from '../components';
import EmailValidationField from '../components/EmailValidationField/EmailValidationField';
import { useFormInput, useNavigateIfRegistered } from '../hooks';
import { setIntoLocalStorage, toastHandler } from '../utils/utils';
import { ToastType, LOCAL_STORAGE_KEYS } from '../constants/constants';
import { useState } from 'react';
import { signupService } from '../Services/services';
import { useAuthContext } from '../contexts/AuthContextProvider';

const SignupPage = () => {
  const signupPageLocation = useLocation();
  const { updateUserAuth, user } = useAuthContext();

  const navigate = useNavigate();
  useNavigateIfRegistered(user);

  const { userInputs, handleInputChange } = useFormInput({
    firstName: '',
    lastName: '',
    email: '',
    passwordMain: '',
    passwordConfirm: '',
  });

  const [isSignupFormLoading, setIsSignupFormLoading] = useState(false);
  const [emailValidation, setEmailValidation] = useState({ isValid: false, message: '' });

  const handleEmailValidationChange = (validation) => {
    setEmailValidation(validation);
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();

    // Validaciones del formulario
    if (!userInputs.firstName.trim()) {
      toastHandler(ToastType.Error, 'Por favor ingresa tu nombre');
      return;
    }

    if (!userInputs.lastName.trim()) {
      toastHandler(ToastType.Error, 'Por favor ingresa tu apellido');
      return;
    }

    if (!userInputs.email.trim()) {
      toastHandler(ToastType.Error, 'Por favor ingresa tu email');
      return;
    }

    // Validar que el email sea válido y existente
    if (!emailValidation.isValid) {
      toastHandler(ToastType.Error, 'Por favor ingresa un email válido y existente en tu proveedor');
      return;
    }

    if (!userInputs.passwordMain.trim()) {
      toastHandler(ToastType.Error, 'Por favor ingresa una contraseña');
      return;
    }

    if (userInputs.passwordMain.length < 6) {
      toastHandler(ToastType.Error, 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (userInputs.passwordMain !== userInputs.passwordConfirm) {
      toastHandler(
        ToastType.Error,
        '¡Las contraseñas no coinciden!'
      );
      return;
    }

    const { email, firstName, lastName, passwordMain: password } = userInputs;

    setIsSignupFormLoading(true);

    try {
      const { user, token } = await signupService({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      // update AuthContext with data
      updateUserAuth({ user, token });

      // store this data in localStorage
      setIntoLocalStorage(LOCAL_STORAGE_KEYS.User, user);
      setIntoLocalStorage(LOCAL_STORAGE_KEYS.Token, token);

      // show success toast
      toastHandler(ToastType.Success, `¡Registro exitoso! Bienvenido ${firstName} 🎉`);

      // if user directly comes to '/signup' from url, so state will be null, after successful registration, user should be directed to home page
      navigate(signupPageLocation?.state?.from ?? '/');
    } catch (error) {
      console.error('Error de registro:', error);
      let errorText = 'Error al crear la cuenta. Intenta nuevamente.';
      
      if (error?.response?.data?.errors && error.response.data.errors.length > 0) {
        const errors = error.response.data.errors;
        if (errors.length > 1) {
          // Mostrar mensaje detallado para cuentas no existentes
          errorText = errors.join('\n');
          toastHandler(ToastType.Error, errors[0]);
          
          // Mostrar opciones adicionales
          setTimeout(() => {
            errors.slice(1).forEach((msg, index) => {
              setTimeout(() => {
                toastHandler(ToastType.Info, msg);
              }, (index + 1) * 1500);
            });
          }, 1000);
          
          setIsSignupFormLoading(false);
          return;
        } else {
          errorText = errors[0];
        }
      } else if (error?.message) {
        errorText = error.message;
      }
      
      toastHandler(ToastType.Error, errorText);
    }

    setIsSignupFormLoading(false);
  };

  //  if user is registered and trying to Signup '/signup' through url, show this and navigate to home using useNavigateIfRegistered().
  if (!!user) {
    return <main className='full-page'></main>;
  }

  return (
    <LoginAndSignupLayout>
      <Title>Registrarse</Title>

      <form onSubmit={handleCreateAccount}>
        <FormRow
          text='Nombre'
          type='text'
          name='firstName'
          id='firstName'
          placeholder='Tu nombre'
          value={userInputs.firstName}
          handleChange={handleInputChange}
          disabled={isSignupFormLoading}
        />
        <FormRow
          text='Apellido'
          type='text'
          name='lastName'
          id='lastName'
          placeholder='Tu apellido'
          value={userInputs.lastName}
          handleChange={handleInputChange}
          disabled={isSignupFormLoading}
        />

        <EmailValidationField
          value={userInputs.email}
          onChange={handleInputChange}
          onValidationChange={handleEmailValidationChange}
          placeholder='tu-email@gmail.com, @yahoo.com, @hotmail.com...'
          disabled={isSignupFormLoading}
        />

        <PasswordRow
          text='Contraseña (mínimo 6 caracteres)'
          name='passwordMain'
          id='passwordMain'
          placeholder='Tu contraseña'
          value={userInputs.passwordMain}
          handleChange={handleInputChange}
          disabled={isSignupFormLoading}
        />
        <PasswordRow
          text='Confirmar Contraseña'
          name='passwordConfirm'
          id='passwordConfirm'
          placeholder='Confirma tu contraseña'
          value={userInputs.passwordConfirm}
          handleChange={handleInputChange}
          disabled={isSignupFormLoading}
        />

        <button 
          className='btn btn-block' 
          type='submit'
          disabled={isSignupFormLoading}
        >
          {isSignupFormLoading ? (
            <span className='loader-2'></span>
          ) : (
            'Crear Nueva Cuenta'
          )}
        </button>
      </form>

      <div>
        <span>
          ¿Ya estás registrado?{' '}
          <Link
            to='/login'
            state={{ from: signupPageLocation?.state?.from ?? '/' }}
          >
            iniciar sesión
          </Link>
        </span>
      </div>
    </LoginAndSignupLayout>
  );
};

export default SignupPage;